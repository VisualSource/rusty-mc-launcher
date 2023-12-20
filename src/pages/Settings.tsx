import { getName, getTauriVersion, getVersion } from "@tauri-apps/api/app";
import { useQuery } from "@tanstack/react-query";

import { Book, HardDriveDownload } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TypographyH3 } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Settings = () => {
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
        <TabsTrigger value="info" className="w-full flex justify-start">
          <Book className="pr-2" /> Info
        </TabsTrigger>
        <TabsTrigger value="download" className="w-full flex justify-start">
          <HardDriveDownload className="pr-2" /> Downloads
        </TabsTrigger>
      </TabsList>
      <TabsContent value="download" className="col-span-10 container">
        <TypographyH3>Game download settings.</TypographyH3>

        <form className="pt-4">
          <Label htmlFor="game-dir">Default minecraft Directory</Label>
          <Input id="game-dir" placeholder="Default minecraft directory" />

          <Button type="submit">Save</Button>
        </form>
      </TabsContent>
      <TabsContent value="info" className="col-span-10 container">
        <TypographyH3>App info.</TypographyH3>
        <div className="h-full">
          <div className="flex flex-col items-center justify-center h-full">
            <div>
              <span className="font-bold">{data?.name}</span>:{" "}
              <span>{data?.version}</span>
            </div>
            <div>
              <span className="font-bold">Tauri</span>:{" "}
              <span>{data?.tauri}</span>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default Settings;
