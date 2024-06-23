import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/workshop/search")({
	component: () => <div>Hello /_workshop/search!</div>,
});
