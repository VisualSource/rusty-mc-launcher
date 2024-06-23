import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/_authenticated/downloads")({
	component: () => <div>Hello /downloads!</div>,
});
