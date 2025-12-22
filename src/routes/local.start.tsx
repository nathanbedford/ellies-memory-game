import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/local/start")({
	component: () => null, // Start game modal is handled in App.tsx based on route
});
