import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/_authenticated/settings")({
	component: () => <div>Hello /settings!</div>,
});
