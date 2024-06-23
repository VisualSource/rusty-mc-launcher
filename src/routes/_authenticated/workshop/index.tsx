import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/workshop/")({
	component: () => <div>Hello /_workshop/!</div>,
});
