import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
	async beforeLoad({ context }) {
		const account = context.auth.msa.getActiveAccount();
		console.log(account);
	},
});
