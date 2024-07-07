import { Check } from "lucide-react";

import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import useCategories from "@/hooks/useCategories";
import type { OptsProps } from "../EditConsts";
import { cn } from "@/lib/utils";

function CollectionOptions({ card, updateCard }: OptsProps) {
    const cats = useCategories();

    return (
        <>
            <Command>
                <CommandInput placeholder="Search categories" />
                <CommandList>
                    <CommandEmpty>No collections found</CommandEmpty>
                    {cats.map(e => (
                        <CommandItem onSelect={() => {
                            updateCard(card.id, {
                                params: {
                                    id: { $set: e.metadata }
                                }
                            });
                        }} key={e.key} value={e.metadata as string}>
                            <Check
                                className={cn(
                                    "mr-2 h-4 w-4",
                                    card.params.id === e.metadata ? "opacity-100" : "opacity-0"
                                )}
                            />
                            {e.value}
                        </CommandItem>
                    ))}
                </CommandList>
            </Command>
        </>
    );
}

export default CollectionOptions;