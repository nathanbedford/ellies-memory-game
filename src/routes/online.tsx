import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/online")({
	component: () => <Outlet />, // Online lobby is handled in App.tsx based on route
});
