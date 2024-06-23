import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/collection")({
	component: () => <div>Hello /_layout/collection!</div>,
});
