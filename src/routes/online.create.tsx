import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/online/create")({
	component: () => null, // Create room view is handled in App.tsx based on route
});
