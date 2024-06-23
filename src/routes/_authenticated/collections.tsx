import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/collections")({
	component: () => <div>Hello /_layout/collections!</div>,
});
