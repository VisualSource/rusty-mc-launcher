import { createLazyFileRoute } from "@tanstack/react-router";
import { useAccount, useMsal } from "@azure/msal-react";
import { LogIn, LogOut, User2, Users2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Loading } from "@/components/Loading";
import { Badge } from "@/components/ui/badge";
import { useModrinth, useModrinthAccount } from "@/hooks/useModrinth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createLazyFileRoute("/_authenticated/settings/accounts")({
	component: AccountsSettings,
	pendingComponent: Loading,
});

function AccountsSettings() {
	const modrinth = useModrinth();
	const modrinthAccount = useModrinthAccount();
	const account = useAccount();
	const { accounts } = useMsal();

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
						{accounts.length ? (
							accounts.map((acc) => (
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
					<div className="flex justify-between items-center mb-4 ">
						<div className="mr-1">
							<h3 className="text-lg font-medium">Modrinth Account</h3>
							<p className="text-muted-foreground text-sm">
								Modrinth account login is currently bugged. Please login into
								the{" "}
								<a
									className="underline text-blue-500"
									href="https://modrinth.com"
								>
									modrinth website
								</a>{" "}
								then click the login button below.
							</p>
						</div>
						<Button
							onClick={() =>
								modrinthAccount ? modrinth.logout() : modrinth.loginPopup()
							}
							size="sm"
						>
							{modrinthAccount ? (
								<>
									<LogOut className="h-4 w-4 mr-2" /> Logout
								</>
							) : (
								<>
									<LogIn className="h-4 w-4 mr-2" /> Login
								</>
							)}
						</Button>
					</div>
					<ul className="space-y-4">
						{modrinth.isLoading ? (
							<li className="flex flex-row items-center justify-center rounded-lg border p-4">
								Loading Account Details
							</li>
						) : (
							<>
								{modrinthAccount ? (
									<li
										key={modrinthAccount.id}
										className="flex flex-row items-center gap-4 rounded-lg border p-4"
									>
										<Avatar>
											<AvatarFallback>
												<User2 />
											</AvatarFallback>
											<AvatarImage src={modrinthAccount.avatar_url} />
										</Avatar>
										<div className="flex flex-col">
											<span className="text-lg">
												{modrinthAccount.username}
											</span>
											<span className="text-muted-foreground text-sm">
												{modrinthAccount.name ?? modrinthAccount.email}
											</span>
										</div>
									</li>
								) : (
									<li className="flex flex-row items-center justify-center rounded-lg border p-4">
										<Users2 className="mr-2" />
										No Modrinth account
									</li>
								)}
							</>
						)}
					</ul>
				</div>
			</div>
		</div>
	);
}
