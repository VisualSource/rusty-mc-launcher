import { useAccount, useMsal } from "@azure/msal-react";
import { TypographyH3 } from "../ui/typography";
import { Badge } from "../ui/badge";

export const Accounts = () => {
    const msal = useMsal();
    const account = useAccount();
    return (
        <>
            <TypographyH3>Accounts</TypographyH3>
            <div className="py-4 space-y-4">
                <details open>
                    <summary className="py-2 font-bold">Microsoft</summary>
                    <ul>
                        {msal.accounts.length > 0 ? (
                            msal.accounts.map((value) => (
                                <li
                                    key={value.homeAccountId}
                                    className="flex w-full justify-between rounded-md border border-gray-500 bg-zinc-800 px-6 py-4 shadow-lg"
                                >
                                    <div>
                                        <span className="mr-2 font-bold">{value.name}</span>
                                        <span className="font-light">{value.username}</span>
                                    </div>
                                    {account?.homeAccountId === value.homeAccountId ? (
                                        <Badge>Active</Badge>
                                    ) : (
                                        <Badge
                                            title="Set as active account."
                                            onClick={() => msal.instance.setActiveAccount(value)}
                                            variant="secondary"
                                        >
                                            Inactive
                                        </Badge>
                                    )}
                                </li>
                            ))
                        ) : (
                            <li className="flex w-full items-center justify-center rounded-md border border-gray-500 bg-zinc-800 px-6 py-4 shadow-lg">
                                No Accounts
                            </li>
                        )}
                    </ul>
                </details>
                <details>
                    <summary className="py-2 font-bold">Modrinth</summary>
                    <ul>
                        <li className="h-6">No Accounts</li>
                        <li className="h-6">No Accounts</li>
                        <li className="h-6">No Accounts</li>
                        <li className="h-6">No Accounts</li>
                        <li className="h-6">No Accounts</li>
                        <li className="h-6">No Accounts</li>
                        <li className="h-6">No Accounts</li>
                        <li className="h-6">No Accounts</li>
                        <li className="h-6">No Accounts</li>
                        <li className="h-6">No Accounts</li>
                        <li className="h-6">No Accounts</li>
                        <li className="h-6">No Accounts</li>
                        <li className="h-6">No Accounts</li>
                        <li className="h-6">No Accounts</li>
                        <li className="h-6">No Accounts</li>

                        <li className="h-6">No Accounts</li>
                        <li className="h-6">No Accounts</li>      <li className="h-6">No Accounts</li>

                    </ul>
                </details>
            </div>
        </>
    );
}