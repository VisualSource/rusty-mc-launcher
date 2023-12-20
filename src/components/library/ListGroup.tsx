import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import useCategoryGroup from "@/lib/hooks/useCategoryGroup";
import { TypographyMuted } from "../ui/typography";
import ListGroupItem from "./ListGroupItem";

const ListGroup: React.FC<
  React.PropsWithChildren<{
    id: number;
    name: string;
    count: number;
    defaultOpen?: boolean;
  }>
> = ({ id, children, defaultOpen = false, name, count = 0 }) => {
  const [open, setOpen] = useState(defaultOpen);
  const category = useCategoryGroup(id);

  return (
    <li>
      <Collapsible
        open={open}
        onOpenChange={(ev) => setOpen(ev)}
        className="w-full"
      >
        <CollapsibleTrigger className="flex py-0.5 px-1 text-zinc-50 items-center bg-gradient-to-r from-zinc-700/95 from-10% to-zinc-800 w-full">
          {open ? <Minus /> : <Plus />}
          <h1 className="text-sm mr-1 line-clamp-1 font-medium">
            {name.toUpperCase()}
          </h1>
          <TypographyMuted className="text-zinc-500">({count})</TypographyMuted>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ul>
            {category.map((value) => (
              <ListGroupItem
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

export default ListGroup;
