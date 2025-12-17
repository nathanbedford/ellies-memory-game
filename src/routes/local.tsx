import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/local')({
  component: () => <Outlet />, // Nested routes will render here
});

