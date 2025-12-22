import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/online/game")({
	component: () => null, // Online game board is handled in App.tsx based on route
});
