import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/local/game")({
	component: () => null, // Game board is handled in App.tsx based on route
});
