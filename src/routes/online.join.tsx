import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/online/join")({
	component: () => null, // Join room view is handled in App.tsx based on route
});
