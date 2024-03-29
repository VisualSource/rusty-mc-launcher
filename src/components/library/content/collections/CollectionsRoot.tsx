import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogContent,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useFetcher, useLoaderData, useSubmit } from "react-router-dom";
import CollectionItem from "./CollectionItem";

const CollectionsRoot: React.FC = () => {
  const [addCollectionOpen, setAddCollectionsOpen] = useState(false);
  const data = useLoaderData() as {
    group_id: number;
    id: string;
    name: string;
  }[];
  const fetcher = useFetcher();

  return (
    <ScrollArea>
      <div className="flex flex-wrap p-2 gap-4">
        {data.map((collection) => (
          <CollectionItem key={collection.id} collection={collection} />
        ))}
        <Dialog onOpenChange={setAddCollectionsOpen} open={addCollectionOpen}>
          <DialogTrigger asChild>
            <button
              className="aspect-square h-44 bg-zinc-800 hover:bg-slate-800 shadow-lg flex items-center justify-center rounded-md"
              title="Add Collection"
            >
              <Plus className="text-zinc-50 h-12 w-12" />
            </button>
          </DialogTrigger>
          <DialogContent className="text-zinc-50">
            <DialogHeader>
              <DialogTitle>Create Collection</DialogTitle>
            </DialogHeader>
            <fetcher.Form
              onSubmit={() => setAddCollectionsOpen(false)}
              action="/collections"
              method="POST"
            >
              <div className="grid items-center gap-1.5 w-full">
                <Label htmlFor="collection-name">Collection name</Label>
                <Input
                  autoComplete="false"
                  id="collection-name"
                  name="collection-name"
                  placeholder="Collection name"
                  required
                  min={1}
                  minLength={1}
                />
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit">Create</Button>
              </div>
            </fetcher.Form>
          </DialogContent>
        </Dialog>
      </div>
    </ScrollArea>
  );
};

export default CollectionsRoot;
