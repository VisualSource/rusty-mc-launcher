import { createLazyFileRoute, Link } from "@tanstack/react-router";

function Index() {
	return (
		<div>
			Hello
			<Link to="/workshop/project/$id" params={{ id: "AANobbMI" }}>
				Workshop
			</Link>
		</div>
	);
}

export const Route = createLazyFileRoute("/_authenticated/_layout/")({
	component: Index,
});
