import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/local/background")({
	component: () => null, // Background selection is handled in App.tsx based on route
});
