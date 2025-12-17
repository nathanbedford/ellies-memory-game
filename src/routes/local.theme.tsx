import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/local/theme')({
  component: () => null, // Theme selection is handled in App.tsx based on route
});

