import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_layout/profile/$id/edit")({
	component: () => <div>Hello /_layout/profile/$id/edit!</div>,
});
