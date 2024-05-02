import { Minus, Plus } from "lucide-react";
import { useState } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@component/ui/collapsible";
import { TypographyMuted } from "@component/ui/typography";
import useCategoryGroup from "@hook/useCategoryGroup";
import CollectionItem from "./CollectionItem";

const Collection: React.FC<{
  id: number;
  name: string;
  count: number;
  defaultOpen?: boolean;
}> = ({ id, defaultOpen = false, name, count = 0 }) => {
  const [open, setOpen] = useState(defaultOpen);
  const collections = useCategoryGroup(id);

  return (
    <li>
      <Collapsible
        open={open}
        onOpenChange={(ev) => setOpen(ev)}
        className="w-full"
      >
        <CollapsibleTrigger className="flex w-full items-center bg-gradient-to-r from-zinc-700/95 from-10% to-zinc-800 px-1 py-0.5 text-zinc-50">
          {open ? <Minus /> : <Plus />}
          <h1 className="mr-1 line-clamp-1 text-sm font-medium">
            {name.toUpperCase()}
          </h1>
          <TypographyMuted className="text-zinc-500">({count})</TypographyMuted>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ul>
            {collections.map((value) => (
              <CollectionItem
                uuid={value.id}
                key={value.id}
                icon={value.icon ?? ""}
                name={value.name}
              />
            ))}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
};

export default Collection;
