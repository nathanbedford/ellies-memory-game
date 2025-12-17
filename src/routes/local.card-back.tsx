import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/local/card-back')({
  component: () => null, // Card back selection is handled in App.tsx based on route
});

