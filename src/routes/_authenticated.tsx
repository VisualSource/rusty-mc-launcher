import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
	beforeLoad({ context }) {
		const user = context.auth.msa.getActiveAccount();

		console.log(user);
	},
	component: () => <Outlet />,
});
