import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/workshop/project/$id")({
	component: () => <div>HellH /_workshop/project/$id!</div>,
});
