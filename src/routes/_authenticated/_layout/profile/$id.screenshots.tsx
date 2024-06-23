import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_layout/profile/$id/screenshots")({
	component: () => <div>Hello /_layout/profile/$d/screenshots!</div>,
});
