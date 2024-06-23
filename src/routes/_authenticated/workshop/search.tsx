import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/workshop/search")({
	component: () => <div>Hello /_workshop/search!</div>,
});
