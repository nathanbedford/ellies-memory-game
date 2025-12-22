import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/local/pair-count")({
	component: () => null, // Pair count selection is handled in App.tsx based on route
});
