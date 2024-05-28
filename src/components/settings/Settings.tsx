import { getName, getTauriVersion, getVersion } from "@tauri-apps/api/app";
import { Book, HardDriveDownload, CircleUserRound } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { version } from "@masl/index";
import { useMsal, useAccount } from "@azure/msal-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TypographyH3, TypographyH4 } from "@/components/ui/typography";
import { Badge } from "../ui/badge";
import { DownloadSettings } from "./DownloadSettings";

const Settings = () => {
  const msal = useMsal();
  const account = useAccount();
  const { data } = useQuery({
    queryKey: ["app-data"],
    queryFn: async () => {
      const [name, tauri, version] = await Promise.all([
        getName(),
        getTauriVersion(),
        getVersion(),
      ]);
      return {
        name,
        tauri,
        version,
      };
    },
  });

  return (
    <Tabs
      className="grid h-full w-full grid-cols-12 bg-blue-900/20 text-zinc-50"
      defaultValue="about"
      orientation="vertical"
    >
      <TabsList className="col-span-2 flex h-full flex-col items-start justify-start gap-2">
        <TabsTrigger value="about" className="flex w-full justify-start">
          <Book className="pr-2" /> About
        </TabsTrigger>
        <TabsTrigger value="account" className="flex w-full justify-start">
          <CircleUserRound className="pr-2" /> Accounts
        </TabsTrigger>
        <TabsTrigger value="download" className="flex w-full justify-start">
          <HardDriveDownload className="pr-2" /> Downloads
        </TabsTrigger>
      </TabsList>
      <TabsContent value="download" className="container col-span-10 space-y-4">
        <DownloadSettings />
      </TabsContent>
      <TabsContent value="account" className="container col-span-10">
        <TypographyH3>Accounts</TypographyH3>
        <div className="py-4">
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
        </div>
      </TabsContent>
      <TabsContent value="about" className="container col-span-10">
        <TypographyH3>About</TypographyH3>
        <div className="mt-4 h-full">
          <TypographyH4>Application Specifications</TypographyH4>
          <div className="mt-2">
            <table>
              <tbody>
                <tr>
                  <th className="text-left" colSpan={2}>
                    App Name
                  </th>
                  <td>{data?.name}</td>
                </tr>
                <tr>
                  <th className="text-left" colSpan={2}>
                    App Version
                  </th>
                  <td>{data?.version}</td>
                </tr>
                <tr>
                  <th className="text-left" colSpan={2}>
                    Tauri Version
                  </th>
                  <td>{data?.tauri}</td>
                </tr>
                <tr>
                  <th className="text-left" colSpan={2}>
                    Msal Version
                  </th>
                  <td>{version}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default Settings;
