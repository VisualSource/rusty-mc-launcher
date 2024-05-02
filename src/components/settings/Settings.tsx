import { getName, getTauriVersion, getVersion } from "@tauri-apps/api/app";
import { Book, HardDriveDownload, CircleUserRound } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { version } from '@masl/index';
import { useMsal, useAccount } from "@azure/msal-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TypographyH3, TypographyH4 } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "../ui/badge";

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
      className="text-zinc-50 grid grid-cols-12 h-full bg-blue-900/20"
      defaultValue="info"
      orientation="vertical"
    >
      <TabsList className="flex flex-col col-span-2 h-full gap-2 justify-start items-start">
        <TabsTrigger value="about" className="w-full flex justify-start">
          <Book className="pr-2" /> About
        </TabsTrigger>
        <TabsTrigger value="account" className="w-full flex justify-start">
          <CircleUserRound className="pr-2" /> Accounts
        </TabsTrigger>
        <TabsTrigger value="download" className="w-full flex justify-start">
          <HardDriveDownload className="pr-2" /> Downloads
        </TabsTrigger>
      </TabsList>
      <TabsContent value="download" className="col-span-10 container space-y-4">
        <TypographyH3>Download Settings</TypographyH3>

        <form>
          <div className="mb-4">
            <Label htmlFor="game-dir">Default minecraft Directory</Label>
            <Input id="game-dir" placeholder="Default minecraft directory" />
          </div>

          <Button type="submit">Save</Button>
        </form>

        <div className="flex flex-col">
          <Label className="mb-4">Clear Cached Images</Label>
          <Button type="button">Clear</Button>
        </div>
      </TabsContent>
      <TabsContent value="account" className="col-span-10 container">
        <TypographyH3>Accounts</TypographyH3>
        <div className="py-4">
          <ul>
            {msal.accounts.length > 0 ? msal.accounts.map(value => (
              <li key={value.homeAccountId} className="flex w-full justify-between py-4 px-6 bg-zinc-800 border border-gray-500 rounded-md shadow-lg">
                <div><span className="font-bold mr-2">{value.name}</span><span className="font-light">{value.username}</span></div>
                {account?.homeAccountId === value.homeAccountId ? (<Badge>Active</Badge>) : <Badge title="Set as active account." onClick={() => msal.instance.setActiveAccount(value)} variant="secondary">Inactive</Badge>}
              </li>
            )) : <li className="flex w-full py-4 px-6 bg-zinc-800 border border-gray-500 rounded-md shadow-lg items-center justify-center">No Accounts</li>}
          </ul>
        </div>
      </TabsContent>
      <TabsContent value="about" className="col-span-10 container">
        <TypographyH3>About</TypographyH3>
        <div className="h-full mt-4">
          <TypographyH4>Application Specifications</TypographyH4>
          <div className="mt-2">
            <table>
              <tbody>
                <tr>
                  <th className="text-left" colSpan={2}>App Name</th>
                  <td>{data?.name}</td>
                </tr>
                <tr>
                  <th className="text-left" colSpan={2}>App Version</th>
                  <td>{data?.version}</td>
                </tr>
                <tr>
                  <th className="text-left" colSpan={2}>Tauri Version</th>
                  <td>{data?.tauri}</td>
                </tr>
                <tr>
                  <th className="text-left" colSpan={2}>Msal Version</th>
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
