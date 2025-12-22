import "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider } from "@tanstack/react-router";
import { PostHogProvider } from "posthog-js/react";
import { router } from "./routes/routeTree";

const posthogKey = "phc_LMb2gHTzOA8grLHOZJFsGvfiX2Adcb41Nqbux1EW0yH";
const posthogHost = "https://us.i.posthog.com";
const isLocalDev = import.meta.env.MODE === "development";

// Router is exported from routeTree.ts
// Type registration is also in routeTree.ts

const rootElement = document.getElementById("root");
if (!rootElement) {
	throw new Error("Root element not found");
}

const app = <RouterProvider router={router} />;

createRoot(rootElement).render(
	isLocalDev ? (
		app
	) : (
		<PostHogProvider
			apiKey={posthogKey}
			options={{
				api_host: posthogHost,
				defaults: "2025-05-24",
				capture_exceptions: true,
			}}
		>
			{app}
		</PostHogProvider>
	),
);
