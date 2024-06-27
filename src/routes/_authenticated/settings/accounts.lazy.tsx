import { createLazyFileRoute } from "@tanstack/react-router";
import { useAccount, useMsal } from "@azure/msal-react";
import { Users2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Loading } from "@/components/Loading";
import { Badge } from "@/components/ui/badge";

export const Route = createLazyFileRoute("/_authenticated/settings/accounts")({
	component: AccountsSettings,
	pendingComponent: Loading,
});
const MODRINTH: { name: string; username: string; homeAccountId: string }[] =
	[];

function AccountsSettings() {
	const account = useAccount();
	const masl = useMsal();
	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">Accounts</h3>
				<p className="text-sm text-muted-foreground">
					Update your account settings.
				</p>
			</div>
			<Separator />
			<div className="space-y-4">
				<div>
					<h3 className="mb-4 text-lg font-medium">Microsoft Accounts</h3>
					<ul className="space-y-4">
						{masl.accounts.length ? (
							masl.accounts.map((acc) => (
								<li
									key={acc.homeAccountId}
									className="flex flex-row items-center justify-between rounded-lg border p-4"
								>
									<div className="flex flex-col">
										<span className="text-lg">{acc.name}</span>
										<span className="text-muted-foreground text-sm italic">
											{acc.username}
										</span>
									</div>
									{account?.homeAccountId === acc.homeAccountId ? (
										<Badge>Active</Badge>
									) : (
										<Badge variant="secondary">Inactive</Badge>
									)}
								</li>
							))
						) : (
							<li className="flex flex-row items-center justify-center rounded-lg border p-4">
								<Users2 className="mr-2" />
								No Accounts
							</li>
						)}
					</ul>
				</div>
				<div>
					<h3 className="mb-4 text-lg font-medium">Modrinth Accounts</h3>
					<ul className="space-y-4">
						{MODRINTH.length ? (
							MODRINTH.map((acc) => (
								<li
									key={acc.homeAccountId}
									className="flex flex-row items-center justify-between rounded-lg border p-4"
								>
									<div className="flex flex-col">
										<span className="text-lg">{acc.name}</span>
										<span className="text-muted-foreground text-sm">
											{acc.username}
										</span>
									</div>
									{account?.homeAccountId === acc.homeAccountId ? (
										<Badge>Active</Badge>
									) : (
										<Badge variant="secondary">Inactive</Badge>
									)}
								</li>
							))
						) : (
							<li className="flex flex-row items-center justify-center rounded-lg border p-4">
								<Users2 className="mr-2" />
								No Accounts
							</li>
						)}
					</ul>
				</div>
			</div>
		</div>
	);
}
