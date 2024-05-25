import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
} from "./command";
import { useFabricLoaderVersions } from "@/hooks/useFabricLoaderVersions";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export const FabricLoaderVersionSelector: React.FC<{
  defaultValue?: string;
  onChange?: (value: string) => void;
}> = ({ onChange, defaultValue }) => {
  const { data, isLoading } = useFabricLoaderVersions();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          disabled={isLoading}
          aria-expanded={open}
          type="button"
          role="combobox"
          variant="outline"
        >
          {isLoading
            ? "Loading Versions..."
            : value
              ? `Fabric Loader ${data?.find((version) => version.version === value)?.version}`
              : "Select Version"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput autoFocus={true} placeholder="Search versions..." />
          <CommandList className="scrollbar max-h-48">
            <CommandEmpty>No Versions Found.</CommandEmpty>
            {isLoading ? (
              <CommandLoading>Loading Versions</CommandLoading>
            ) : null}
            <CommandGroup>
              {data?.map((item) => (
                <CommandItem
                  className="z-[10000000] w-full"
                  key={item.version}
                  value={item.version}
                  onSelect={(currentValue) => {
                    const nextValue =
                      currentValue === value ? "" : currentValue;
                    setValue(currentValue === value ? "" : currentValue);
                    setOpen(false);
                    onChange?.call(undefined, nextValue);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === item.version ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {item.version}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
