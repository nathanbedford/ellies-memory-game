import { useCallback, useEffect, useRef } from "react";

interface PongProps {
	isOpen: boolean;
	onClose: () => void;
}

const PONG_WIDTH = 10;
const PONG_HEIGHT = 80;
const BALL_SIZE = 10;
const PADDLE_SPEED = 5;
const INITIAL_BALL_SPEED = 4;

export const Pong = ({ isOpen, onClose }: PongProps) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationFrameRef = useRef<number | undefined>(undefined);
	const scoreRef = useRef({ left: 0, right: 0 });

	const gameStateRef = useRef({
		leftPaddle: { y: 200 },
		rightPaddle: { y: 200 },
		ball: { x: 400, y: 300, vx: INITIAL_BALL_SPEED, vy: INITIAL_BALL_SPEED },
		keys: { w: false, s: false, ArrowUp: false, ArrowDown: false },
	});

	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === "w" || e.key === "W") gameStateRef.current.keys.w = true;
			if (e.key === "s" || e.key === "S") gameStateRef.current.keys.s = true;
			if (e.key === "ArrowUp") gameStateRef.current.keys.ArrowUp = true;
			if (e.key === "ArrowDown") gameStateRef.current.keys.ArrowDown = true;
			if (e.key === "Escape") onClose();
		},
		[onClose],
	);

	const handleKeyUp = useCallback((e: KeyboardEvent) => {
		if (e.key === "w" || e.key === "W") gameStateRef.current.keys.w = false;
		if (e.key === "s" || e.key === "S") gameStateRef.current.keys.s = false;
		if (e.key === "ArrowUp") gameStateRef.current.keys.ArrowUp = false;
		if (e.key === "ArrowDown") gameStateRef.current.keys.ArrowDown = false;
	}, []);

	useEffect(() => {
		if (!isOpen) return;

		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		canvas.width = 800;
		canvas.height = 600;

		// Reset game state
		gameStateRef.current = {
			leftPaddle: { y: canvas.height / 2 - PONG_HEIGHT / 2 },
			rightPaddle: { y: canvas.height / 2 - PONG_HEIGHT / 2 },
			ball: {
				x: canvas.width / 2,
				y: canvas.height / 2,
				vx: INITIAL_BALL_SPEED,
				vy: INITIAL_BALL_SPEED,
			},
			keys: { w: false, s: false, ArrowUp: false, ArrowDown: false },
		};

		scoreRef.current = { left: 0, right: 0 };

		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("keyup", handleKeyUp);

		const gameLoop = () => {
			const state = gameStateRef.current;
			const width = canvas.width;
			const height = canvas.height;

			// Update paddles
			if (state.keys.w && state.leftPaddle.y > 0) {
				state.leftPaddle.y -= PADDLE_SPEED;
			}
			if (state.keys.s && state.leftPaddle.y < height - PONG_HEIGHT) {
				state.leftPaddle.y += PADDLE_SPEED;
			}
			if (state.keys.ArrowUp && state.rightPaddle.y > 0) {
				state.rightPaddle.y -= PADDLE_SPEED;
			}
			if (state.keys.ArrowDown && state.rightPaddle.y < height - PONG_HEIGHT) {
				state.rightPaddle.y += PADDLE_SPEED;
			}

			// Update ball
			state.ball.x += state.ball.vx;
			state.ball.y += state.ball.vy;

			// Ball collision with top and bottom walls
			if (state.ball.y <= 0 || state.ball.y >= height - BALL_SIZE) {
				state.ball.vy = -state.ball.vy;
			}

			// Ball collision with left paddle
			if (
				state.ball.vx < 0 && // Only bounce if moving left
				state.ball.x <= PONG_WIDTH &&
				state.ball.x >= 0 &&
				state.ball.y + BALL_SIZE >= state.leftPaddle.y &&
				state.ball.y <= state.leftPaddle.y + PONG_HEIGHT
			) {
				state.ball.vx = Math.abs(state.ball.vx);
				// Add some spin based on where it hits the paddle
				const hitPos = (state.ball.y - state.leftPaddle.y) / PONG_HEIGHT;
				state.ball.vy = (hitPos - 0.5) * 8;
			}

			// Ball collision with right paddle
			if (
				state.ball.vx > 0 && // Only bounce if moving right
				state.ball.x >= width - PONG_WIDTH - BALL_SIZE &&
				state.ball.x <= width &&
				state.ball.y + BALL_SIZE >= state.rightPaddle.y &&
				state.ball.y <= state.rightPaddle.y + PONG_HEIGHT
			) {
				state.ball.vx = -Math.abs(state.ball.vx);
				// Add some spin based on where it hits the paddle
				const hitPos = (state.ball.y - state.rightPaddle.y) / PONG_HEIGHT;
				state.ball.vy = (hitPos - 0.5) * 8;
			}

			// Score points
			if (state.ball.x < 0) {
				scoreRef.current.right += 1;
				state.ball.x = width / 2;
				state.ball.y = height / 2;
				state.ball.vx = INITIAL_BALL_SPEED;
				state.ball.vy = INITIAL_BALL_SPEED;
			}
			if (state.ball.x > width) {
				scoreRef.current.left += 1;
				state.ball.x = width / 2;
				state.ball.y = height / 2;
				state.ball.vx = -INITIAL_BALL_SPEED;
				state.ball.vy = INITIAL_BALL_SPEED;
			}

			// Draw background
			ctx.fillStyle = "#000";
			ctx.fillRect(0, 0, width, height);

			// Draw center line
			ctx.strokeStyle = "#fff";
			ctx.setLineDash([10, 10]);
			ctx.beginPath();
			ctx.moveTo(width / 2, 0);
			ctx.lineTo(width / 2, height);
			ctx.stroke();
			ctx.setLineDash([]);

			// Draw paddles
			ctx.fillStyle = "#fff";
			ctx.fillRect(0, state.leftPaddle.y, PONG_WIDTH, PONG_HEIGHT);
			ctx.fillRect(
				width - PONG_WIDTH,
				state.rightPaddle.y,
				PONG_WIDTH,
				PONG_HEIGHT,
			);

			// Draw ball
			ctx.fillRect(state.ball.x, state.ball.y, BALL_SIZE, BALL_SIZE);

			// Draw score
			ctx.fillStyle = "#fff";
			ctx.font = "48px monospace";
			ctx.textAlign = "center";
			ctx.fillText(`${scoreRef.current.left}`, width / 4, 60);
			ctx.fillText(`${scoreRef.current.right}`, (3 * width) / 4, 60);

			animationFrameRef.current = requestAnimationFrame(gameLoop);
		};

		animationFrameRef.current = requestAnimationFrame(gameLoop);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("keyup", handleKeyUp);
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
		};
	}, [isOpen, handleKeyDown, handleKeyUp]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
			<div className="relative">
				<button
					type="button"
					onClick={onClose}
					className="absolute -top-12 right-0 text-white hover:text-gray-300 text-sm"
				>
					Press ESC or click to close
				</button>
				<canvas ref={canvasRef} className="border-2 border-white" />
				<div className="absolute -bottom-12 left-0 right-0 text-center text-white text-sm">
					<p>Left: W/S | Right: ↑/↓</p>
				</div>
			</div>
		</div>
	);
};
