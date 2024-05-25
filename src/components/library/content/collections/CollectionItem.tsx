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
import { FAVORITES_GUID, UNCATEGORIZEDP_GUID } from "@/lib/models/categories";
import { TypographyH4, TypographyMuted } from "@/components/ui/typography";
import type { Setting } from "@/lib/models/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEFAULT_GROUP = [FAVORITES_GUID, UNCATEGORIZEDP_GUID];

const CollectionItem: React.FC<{
  collection: Setting;
}> = ({ collection }) => {
  const [open, setOpen] = useState(false);
  const submit = useSubmit();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex aspect-square h-44 items-center justify-center rounded-md bg-zinc-800 shadow-lg hover:bg-slate-800">
          <TypographyH4 className="line-clamp-3 text-wrap text-lg text-zinc-50">
            {collection.value}
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
          {DEFAULT_GROUP.includes(collection.metadata!) ? (
            <div className="mb-4">
              <TypographyMuted>This colletion is not editable.</TypographyMuted>
            </div>
          ) : (
            <div className="mb-4 grid w-full items-center gap-1.5">
              <input
                name="id"
                defaultValue={collection.metadata!}
                className="hidden"
                readOnly
              />
              <Label htmlFor="name">Collection name</Label>
              <Input
                autoComplete="false"
                defaultValue={collection.value}
                id="name"
                name="name"
                placeholder="Collection name"
                required
                min={1}
                minLength={1}
              />
            </div>
          )}
          {DEFAULT_GROUP.includes(collection.metadata!) ? null : (
            <DialogFooter>
              <div className="flex w-full justify-between">
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
                <Button type="submit">Save</Button>
              </div>
            </DialogFooter>
          )}
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CollectionItem;
