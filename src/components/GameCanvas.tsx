import React, { useRef, useEffect, useState } from 'react';
import { GameEngine } from '../game/GameEngine';

const GameCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
    const engineRef = useRef<GameEngine | null>(null);

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
            if (engineRef.current) engineRef.current.resize();
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Initialize Engine
        engineRef.current = new GameEngine(canvas);
        const engine = engineRef.current;

        let animationFrameId: number;
        let lastTime = 0;

        const render = (time: number) => {
            const deltaTime = time - lastTime;
            lastTime = time;

            engine.update(deltaTime);
            engine.draw();

            animationFrameId = window.requestAnimationFrame(render);
        };

        render(0);

        // Input Listeners
        const handleKeyDown = (e: KeyboardEvent) => {
            if (engine.handleInput) {
                engine.handleInput('keydown', e);
                // Handle restart outside? or inside engine
                if (e.code === 'Space' && (engine as any).state?.state === 'GAMEOVER') {
                    engine.restart();
                }
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => engine.handleInput('keyup', e);
        const handleMouseMove = (e: MouseEvent) => engine.handleInput('mousemove', e);

        // Touch Handlers
        const handleTouchMove = (e: TouchEvent) => engine.handleInput('touchmove', e);
        const handleTouchStart = (e: TouchEvent) => engine.handleInput('touchstart', e);

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        // Use canvas for Mouse/Touch to ensure coordinates are relative to it/target correct element?
        // Actually window.addEventListener for mousemove is good for dragging, but for touch mostly we want canvas.
        // However, for swipe on full screen game, window is fine.
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchstart', handleTouchStart, { passive: false });

        return () => {
            window.cancelAnimationFrame(animationFrameId);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchstart', handleTouchStart);
        };
    }, [windowSize]);

    return (
        <canvas
            ref={canvasRef}
            width={windowSize.width}
            height={windowSize.height}
            style={{ display: 'block', background: '#0d0d12', cursor: 'none' }}
        />
    );
};

export default GameCanvas;
