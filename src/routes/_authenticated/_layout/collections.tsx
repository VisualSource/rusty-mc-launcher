import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_layout/collections")({
	component: () => <div>Hello /_layout/collections!</div>,
});
