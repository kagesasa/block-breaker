import type { GameState, Brick } from './types';

export class GameEngine {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private state: GameState;
    private input: { left: boolean; right: boolean; mouseX: number | null } = {
        left: false,
        right: false,
        mouseX: null,
    };

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.state = this.getInitialState();

        this.resize();
    }

    private getInitialState(): GameState {
        const width = this.canvas.width;
        const height = this.canvas.height;

        return {
            paddle: {
                x: width / 2 - 50,
                y: height - 40,
                width: 100,
                height: 15,
                color: '#00d2ff',
            },
            ball: {
                x: width / 2,
                y: height - 50,
                radius: 8,
                vx: 3,
                vy: -7,
                speed: 7,
                color: '#ffffff',
            },
            bricks: this.generateBricks(width),
            particles: [],
            score: 0,
            lives: 3,
            state: 'MENU',
        };
    }

    private generateBricks(canvasWidth: number): Brick[] {
        const cols = 8;
        const rows = 5;
        const padding = 10;
        const totalPadding = (cols + 1) * padding;
        const brickWidth = (canvasWidth - totalPadding) / cols;
        const brickHeight = 20;
        const bricks: Brick[] = [];

        const colors = ['#ff0055', '#ff9900', '#ffff00', '#33ff00', '#0099ff'];

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                bricks.push({
                    x: padding + c * (brickWidth + padding),
                    y: padding + r * (brickHeight + padding) + 60,
                    width: brickWidth,
                    height: brickHeight,
                    color: colors[r % colors.length],
                    active: true
                });
            }
        }
        return bricks;
    }

    // ... input handling ... 

    public handleInput(type: 'keydown' | 'keyup' | 'mousemove' | 'touchmove' | 'touchstart', event: KeyboardEvent | MouseEvent | TouchEvent) {
        if (type === 'mousemove') {
            const e = event as MouseEvent;
            const rect = this.canvas.getBoundingClientRect();
            this.input.mouseX = e.clientX - rect.left;
        } else if (type === 'touchmove') {
            const e = event as TouchEvent;
            e.preventDefault(); // Prevent scrolling
            const rect = this.canvas.getBoundingClientRect();
            if (e.touches.length > 0) {
                this.input.mouseX = e.touches[0].clientX - rect.left;
            }
        } else if (type === 'touchstart') {
            const e = event as TouchEvent;
            // Start game on touch
            if (this.state.state !== 'PLAYING') {
                if (this.state.state === 'GAMEOVER') {
                    this.restart();
                } else {
                    this.state.state = 'PLAYING';
                }
            }
            // Also update position immediately
            const rect = this.canvas.getBoundingClientRect();
            if (e.touches.length > 0) {
                this.input.mouseX = e.touches[0].clientX - rect.left;
            }
        } else if (type === 'keydown' || type === 'keyup') {
            const e = event as KeyboardEvent;
            const isDown = type === 'keydown';
            if (e.code === 'ArrowLeft') this.input.left = isDown;
            if (e.code === 'ArrowRight') this.input.right = isDown;

            if (type === 'keydown' && e.code === 'Space') {
                if (this.state.state !== 'PLAYING') {
                    if (this.state.state === 'GAMEOVER') {
                        this.restart();
                    } else {
                        this.state.state = 'PLAYING';
                    }
                }
            }
        }
    }

    public resize() {
        if (this.state.paddle.y > this.canvas.height - 20) {
            this.state.paddle.y = this.canvas.height - 40;
        }
    }

    public update(deltaTime: number) {
        void deltaTime;

        const { width, height } = this.canvas;
        const { paddle, ball, bricks, particles } = this.state;

        // Update Particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            p.vy += 0.1; // Gravity
            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }

        if (this.state.state !== 'PLAYING') return;

        // Paddle Movement
        if (this.input.mouseX !== null) {
            paddle.x = this.input.mouseX - paddle.width / 2;
            this.input.mouseX = null;
        } else {
            if (this.input.left) paddle.x -= 10; // Increased paddle speed
            if (this.input.right) paddle.x += 10;
        }
        // Clamp
        if (paddle.x < 0) paddle.x = 0;
        if (paddle.x + paddle.width > width) paddle.x = width - paddle.width;

        // Ball Movement
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Ball Wall Collision
        if (ball.x - ball.radius < 0 || ball.x + ball.radius > width) {
            ball.vx *= -1;
        }
        if (ball.y - ball.radius < 0) {
            ball.vy *= -1;
        }

        // Ball Floor
        if (ball.y + ball.radius > height) {
            this.state.lives -= 1;
            this.createParticles(ball.x, ball.y, '#ffffff', 20); // Splash on floor
            this.resetBall();
            if (this.state.lives <= 0) {
                this.state.state = 'GAMEOVER';
            }
        }

        // Paddle Collision
        if (
            ball.y + ball.radius >= paddle.y &&
            ball.y - ball.radius <= paddle.y + paddle.height &&
            ball.x >= paddle.x &&
            ball.x <= paddle.x + paddle.width
        ) {
            if (ball.vy > 0) {
                ball.vy *= -1;
                const hitPoint = ball.x - (paddle.x + paddle.width / 2);
                // Add horizontal velocity based on hit point, but keep total speed roughly constant or increase slightly?
                // For now just add component
                ball.vx = hitPoint * 0.2;
                // Ensure minimum vertical speed
                if (Math.abs(ball.vy) < 4) ball.vy = ball.vy > 0 ? 4 : -4;

                this.createParticles(ball.x, ball.y + ball.radius, paddle.color, 5); // Small spark
            }
        }

        // Brick Collision
        for (const brick of bricks) {
            if (!brick.active) continue;

            if (
                ball.x + ball.radius > brick.x &&
                ball.x - ball.radius < brick.x + brick.width &&
                ball.y + ball.radius > brick.y &&
                ball.y - ball.radius < brick.y + brick.height
            ) {
                brick.active = false;
                ball.vy *= -1;
                this.state.score += 10;

                // INCREASE SPEED
                // Increase by 5% per hit (playable but challenging curve)
                ball.vx *= 1.05;
                ball.vy *= 1.05;
                // Cap speed to prevent physics breaking (optional)
                const maxSpeed = 20;
                if (Math.abs(ball.vx) > maxSpeed) ball.vx = Math.sign(ball.vx) * maxSpeed;
                if (Math.abs(ball.vy) > maxSpeed) ball.vy = Math.sign(ball.vy) * maxSpeed;

                this.createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color, 15);
                break;
            }
        }

        if (bricks.every(b => !b.active)) {
            this.resetLevel();
        }
    }

    private createParticles(x: number, y: number, color: string, count: number) {
        for (let i = 0; i < count; i++) {
            this.state.particles.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 1.0,
                color: color
            });
        }
    }

    private resetBall() {
        const { width, height } = this.canvas;
        this.state.ball.x = width / 2;
        this.state.ball.y = height - 50;
        // INITIAL SPEED (Playable speed)
        const initialSpeed = 7;
        this.state.ball.vx = initialSpeed * (Math.random() > 0.5 ? 0.5 : -0.5); // Slight angle
        this.state.ball.vy = -initialSpeed;
    }


    private resetLevel() {
        this.state.bricks = this.generateBricks(this.canvas.width);
        this.resetBall();
    }

    public draw() {
        const { width, height } = this.canvas;
        const { paddle, ball, bricks, particles, lives, score, state } = this.state;

        this.ctx.clearRect(0, 0, width, height);

        // Particles
        for (const p of particles) {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x, p.y, 4, 4);
            this.ctx.globalAlpha = 1.0;
        }

        // Bricks
        for (const brick of bricks) {
            if (!brick.active) continue;
            this.ctx.fillStyle = brick.color;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = brick.color;
            this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
            this.ctx.shadowBlur = 0;
        }

        // Paddle
        // Gradient for paddle
        const pGrad = this.ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
        pGrad.addColorStop(0, '#00ffff');
        pGrad.addColorStop(1, '#0055ff');
        this.ctx.fillStyle = pGrad;
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = '#00ccff';
        this.ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
        this.ctx.shadowBlur = 0;

        // Ball
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = '#fff';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#fff';
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        this.ctx.closePath();

        // HUD
        this.ctx.fillStyle = 'rgba(255,255,255,0.8)';
        this.ctx.font = 'bold 20px Inter, sans-serif';
        this.ctx.fillText(`SCORE: ${score}`, 20, 35);
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`LIVES: ${lives}`, width - 20, 35);
        this.ctx.textAlign = 'start';

        if (state === 'MENU') {
            this.drawOverlay('BLOCK BREAKER', 'Press SPACE to Start', '#00d2ff');
        } else if (state === 'GAMEOVER') {
            this.drawOverlay('GAME OVER', 'Press SPACE to Restart', '#ff4444');
        }
    }

    private drawOverlay(text: string, subtext?: string, color: string = '#fff') {
        const { width, height } = this.canvas;
        // Glassmorphism overlay
        this.ctx.fillStyle = 'rgba(13, 13, 18, 0.7)';
        this.ctx.fillRect(0, 0, width, height);

        this.ctx.save();
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = color;
        this.ctx.fillStyle = color;
        this.ctx.font = 'bold 60px Inter, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(text, width / 2, height / 2 - 20);
        this.ctx.restore();

        if (subtext) {
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '24px Inter, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(subtext, width / 2, height / 2 + 50);

            // Blinking effect maybe?
            if (Math.floor(Date.now() / 500) % 2 === 0) {
                // Blink
            }
        }
        this.ctx.textAlign = 'start';
    }

    public restart() {
        this.state = this.getInitialState();
        this.state.state = 'PLAYING';
    }
}
