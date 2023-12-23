import { Form, useSubmit } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TypographyH4, TypographyMuted } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CollectionItem: React.FC<{
  collection: { name: string; group_id: number; id: string };
}> = ({ collection }) => {
  const [open, setOpen] = useState(false);
  const submit = useSubmit();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="aspect-square h-44 bg-zinc-800 hover:bg-slate-800 shadow-lg flex items-center justify-center rounded-md">
          <TypographyH4 className="text-lg line-clamp-1 text-zinc-50">
            {collection.name}
          </TypographyH4>
        </button>
      </DialogTrigger>
      <DialogContent className="text-zinc-50">
        <DialogHeader>
          <DialogTitle>Edit Collection</DialogTitle>
        </DialogHeader>
        <Form
          onSubmit={() => setOpen(false)}
          action="/collections"
          method="PATCH"
        >
          {collection.group_id === 0 || collection.group_id === 1 ? (
            <div className="mb-4">
              <TypographyMuted>Unable to edit this collection.</TypographyMuted>
            </div>
          ) : (
            <div className="grid items-center gap-1.5 w-full mb-4">
              <input
                name="id"
                defaultValue={collection.id}
                className="hidden"
                readOnly
              />
              <Label htmlFor="collection-name">Collection name</Label>
              <Input
                autoComplete="false"
                defaultValue={collection.name}
                id="collection-name"
                name="collection-name"
                placeholder="Collection name"
                required
                min={1}
                minLength={1}
              />
            </div>
          )}

          <DialogFooter>
            <div className="flex justify-between w-full">
              {collection.group_id === 0 || collection.group_id === 1 ? null : (
                <Button
                  onClick={() => {
                    submit(collection, { method: "DELETE" });
                    setOpen(false);
                  }}
                  title="Delete Collection"
                  type="button"
                  variant="destructive"
                  size="icon"
                >
                  <Trash2 />
                </Button>
              )}
              <Button type="submit">Save</Button>
            </div>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CollectionItem;
