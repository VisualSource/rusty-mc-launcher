import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/workshop/")({
	component: () => <div>Hello /_workshop/!</div>,
});
