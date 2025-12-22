import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/local/card-pack")({
	component: () => null, // Card pack selection is handled in App.tsx based on route
});
