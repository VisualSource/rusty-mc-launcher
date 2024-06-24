import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ContentTab } from '@/components/library/content/profile/ContentTab';
import { profileQueryOptions } from './$id';
//import { Button } from '@/components/ui/button';
//import { open } from "@tauri-apps/api/dialog";
//import { FileBox, Trash2 } from 'lucide-react';

export const Route = createFileRoute('/_authenticated/_layout/profile/$id/content')({
  component: ProfileContent
});

function ProfileContent() {
  const params = Route.useParams();
  const profile = useSuspenseQuery(profileQueryOptions(params.id));

  return (
    <div className="h-full space-y-4 overflow-hidden rounded-md bg-zinc-900 px-4 py-2 shadow-lg">
      <Tabs defaultValue="mods" className="flex h-full w-full flex-col">
        <TabsList className="w-full">
          <TabsTrigger value="mods">Mods</TabsTrigger>
          <TabsTrigger value="resource">Resource Packs</TabsTrigger>
          <TabsTrigger value="shader">Shader Packs</TabsTrigger>
        </TabsList>
        <TabsContent value="mods" className="h-full flex-col pb-10">
          <ContentTab profile={profile.data} content_type="Mod" />
        </TabsContent>
        <TabsContent value="resource" className="h-full flex-col pb-10">
          <ContentTab profile={profile.data} content_type="Resourcepack" />
        </TabsContent>
        <TabsContent value="shader" className="h-full flex-col pb-10">
          <ContentTab profile={profile.data} content_type="Shader" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
/*
   <header className='flex gap-2 mt-2'>
            <Button
              title="Install content from out side launcher"
              className="w-full"
              variant="secondary"
              size="sm"
            >
              <FileBox className="mr-1 h-5 w-5" />
              Install
            </Button>
            <Button size="sm">Update All</Button>
            <Button size="sm" variant="destructive">
              <Trash2 className="mr-1 h-5 w-5" />
              Delete All
            </Button>
          </header>

*/