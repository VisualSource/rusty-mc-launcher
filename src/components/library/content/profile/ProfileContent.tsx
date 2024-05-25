import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOutletContext } from "react-router-dom";

const ProfileContent: React.FC = () => {
  const ctx = useOutletContext();

  return (
    <div className="h-full space-y-4 rounded-md bg-zinc-900 px-4 py-2 shadow-lg">
      <Tabs className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="mods">Mods</TabsTrigger>
          <TabsTrigger value="datapacks">Datapacks</TabsTrigger>
          <TabsTrigger value="resource">Resource Packs</TabsTrigger>
          <TabsTrigger value="shader">Shader Packs</TabsTrigger>
        </TabsList>
        <TabsContent value="mods"></TabsContent>
        <TabsContent value="datapacks"></TabsContent>
        <TabsContent value="resource"></TabsContent>
        <TabsContent value="shader"></TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfileContent;
