import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/game-over')({
  component: () => null, // Game over screen is handled in App.tsx based on route
});

