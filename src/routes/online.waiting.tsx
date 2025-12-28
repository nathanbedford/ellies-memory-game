import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/online/waiting")({
	component: () => null, // Waiting room view is handled in App.tsx based on route
});

