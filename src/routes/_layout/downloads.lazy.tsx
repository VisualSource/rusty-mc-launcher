import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/_layout/downloads")({
	component: () => <div>Hello /downloads!</div>,
});
