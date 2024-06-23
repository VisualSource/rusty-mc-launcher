import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/_layout/settings")({
	component: () => <div>Hello /settings!</div>,
});
