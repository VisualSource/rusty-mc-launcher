import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/profile/$id/edit")({
	component: () => <div>Hello /_layout/profile/$id/edit!</div>,
});
