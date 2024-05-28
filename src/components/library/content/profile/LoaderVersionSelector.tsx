import type { UseFormReturn } from "react-hook-form";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { MinecraftProfile } from "@/lib/models/profiles";
import { useQuery } from "@tanstack/react-query";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

type FabricMetadata = {
  version: string;
  stable: boolean;
};
type QuiltMetadata = {
  version: string;
};

export const LoaderVersionSelector: React.FC<{
  form: UseFormReturn<MinecraftProfile, any, undefined>;
  stable: boolean;
}> = ({ stable, form }) => {
  const [open, setOpen] = useState(false);
  const [loader, version] = form.watch(["loader", "version"]);
  const { data, isError, isLoading, error } = useQuery({
    enabled: loader !== "vanilla",
    queryKey: ["MODLOADER_VERSION", loader, version, stable],
    queryFn: async () => {
      switch (loader) {
        case "fabric": {
          const response = await fetch(
            "https://meta.fabricmc.net/v2/versions/loader",
          );
          const data = (await response.json()) as FabricMetadata[];
          if (!stable) {
            return data.map((item) => item.version);
          }

          return data.filter((item) => item.stable).map((item) => item.version);
        }
        case "quilt": {
          const response = await fetch(
            "https://meta.quiltmc.org/v3/versions/loader",
          );
          const data = (await response.json()) as QuiltMetadata[];
          if (!stable) {
            return data.map((item) => item.version);
          }
          return data
            .filter((item) => !item.version.includes("beta"))
            .map((e) => e.version);
        }
        case "forge": {
          const response = await fetch(
            "https://maven.minecraftforge.net/net/minecraftforge/forge/maven-metadata.xml",
          );
          const data = await response.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(data, "application/xml");
          const errorNode = doc.querySelector("parseerror");
          if (errorNode) return [];

          let output = [];
          const target = `${version}-`;
          for (const item of doc.querySelectorAll("version")) {
            if (item.textContent?.startsWith(version)) {
              output.push(item.textContent.replace(target, ""));
            }
          }

          return output;
        }

        default:
          throw new Error("There are no loader version for vanilla");
      }
    },
  });

  if (loader === "vanilla") return null;
  return (
    <FormField
      defaultValue={data?.[0]}
      control={form.control}
      name="loader_version"
      rules={{
        required: { value: true, message: "A loader version is required!" },
      }}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Loader Version</FormLabel>
          <FormControl>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  className="w-full"
                  disabled={isError}
                  variant="outline"
                  role="combobox"
                  type="button"
                  aria-expanded={open}
                >
                  {field.value ?? "Select version..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <Command>
                  <CommandInput placeholder="Search Versions..." />
                  {isLoading ? (
                    <CommandLoading>Loading versions...</CommandLoading>
                  ) : null}
                  <CommandEmpty>No versions found.</CommandEmpty>
                  <CommandList className="scrollbar">
                    {data?.map((version) => (
                      <CommandItem
                        key={version}
                        value={version}
                        onSelect={(currentValue) => {
                          field.onChange(
                            field.value === currentValue
                              ? undefined
                              : currentValue,
                          );
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            field.value === version
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        {version}
                      </CommandItem>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </FormControl>
          <FormDescription>The loader version to use.</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
