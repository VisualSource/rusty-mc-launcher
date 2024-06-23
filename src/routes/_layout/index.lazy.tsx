import { createLazyFileRoute, Link } from "@tanstack/react-router";

function Index() {
	return (
		<div>
			Hello
			<Link to="/workshop/project/$id" params={{ id: "TEST" }}>
				Workshop
			</Link>
		</div>
	);
}

export const Route = createLazyFileRoute("/_layout/")({
	component: Index,
});
