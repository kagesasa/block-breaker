export interface Vector2D {
    x: number;
    y: number;
}

export interface Paddle {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
}

export interface Ball {
    x: number;
    y: number;
    radius: number;
    vx: number;
    vy: number;
    speed: number;
    color: string;
}

export interface Brick {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    active: boolean;
}

export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
}

export interface GameState {
    paddle: Paddle;
    ball: Ball;
    bricks: Brick[];
    particles: Particle[];
    score: number;
    lives: number;
    state: 'MENU' | 'PLAYING' | 'GAMEOVER';
}
