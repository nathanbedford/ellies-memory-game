import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: () => null, // Mode selection is handled in App.tsx based on route
});
