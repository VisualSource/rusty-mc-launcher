import { createFileRoute } from "@tanstack/react-router";
import { Loading } from "@/components/Loading";

export const Route = createFileRoute("/_authenticated/workshop/search")({
	pendingComponent: Loading,
	search: {},
});
