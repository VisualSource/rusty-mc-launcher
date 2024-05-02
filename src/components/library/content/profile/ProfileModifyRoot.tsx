import { CaretSortIcon } from "@radix-ui/react-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFormContext } from "react-hook-form";
import { Book, Check, Trash } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@component/ui/form";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@component/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@component/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@component/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TypographyMuted } from "@/components/ui/typography";
import useMinecraftVersions from "@hook/useMinecraftVersion";
import { Switch } from "@component/ui/switch";
import { Button } from "@component/ui/button";
import { Input } from "@component/ui/input";
import { cn } from "@lib/utils";

export const schema = z
  .object({
    name: z.string().min(4, {
      message: "Name must be at least 4 characters.",
    }),
  })
  .passthrough();

export const resolver = zodResolver(schema);

const ProfileModifyRoot: React.FC<{ editMods?: boolean }> = ({
  editMods = false,
}) => {
  const [icon, setIcon] = useState<boolean>(false);
  const [popoverVersion, setPopoverVersion] = useState<boolean>(false);
  const { control, watch, setValue } = useFormContext();

  const loader = watch("loader");
  const minecraft_versions = useMinecraftVersions(loader);

  return (
    <>
      <FormField
        name="name"
        control={control}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input autoComplete="false" placeholder="Name" {...field} />
            </FormControl>
            <FormDescription>Profile Name</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="icon"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Profile Icon</FormLabel>
            <Popover open={icon} onOpenChange={setIcon}>
              <PopoverTrigger asChild>
                <FormControl>
                  <div className="line-clamp-1 flex items-center">
                    <Avatar className="mr-2 h-8 w-8">
                      <AvatarFallback>
                        <Book />
                      </AvatarFallback>
                      <AvatarImage src={field.value} alt="profile icon" />
                    </Avatar>
                    <Input
                      value={field.value}
                      placeholder="No Icon"
                      onChange={(ev) => field.onChange(ev.target.value)}
                      role="combobox"
                      className={cn(
                        "justify-between",
                        !field.value && "text-muted-foreground",
                      )}
                    />
                    <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </div>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="p-0">
                <Command>
                  <CommandInput
                    placeholder="Search versions..."
                    className="h-9"
                  />
                  <CommandEmpty>No icons found.</CommandEmpty>
                </Command>
              </PopoverContent>
            </Popover>
            <FormDescription>The icon for this profile.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        defaultValue="latest-release"
        control={control}
        name="lastVersionId"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Minecraft Version</FormLabel>
            <Popover open={popoverVersion} onOpenChange={setPopoverVersion}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    disabled={minecraft_versions.isLoading}
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "justify-between",
                      !field.value && "text-muted-foreground",
                    )}
                  >
                    {field.value
                      ? minecraft_versions.data?.versions.find(
                          (language) => language.id === field.value,
                        )?.id ?? "Version not found"
                      : "Select Version"}
                    <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="p-0">
                <Command>
                  <CommandInput
                    placeholder="Search versions..."
                    className="h-9"
                  />
                  <CommandEmpty>No version found.</CommandEmpty>
                  <CommandGroup>
                    {minecraft_versions.data?.versions.map((version) => (
                      <CommandItem
                        value={version.id}
                        key={version.id}
                        onSelect={() => {
                          setValue("lastVersionId", version.id);
                          setPopoverVersion(false);
                        }}
                      >
                        {version.id}
                        <Check
                          className={cn(
                            "ml-auto h-4 w-4",
                            version.id === field.value
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            <FormDescription>
              This is the version of that game that will be used.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        defaultValue="vanilla"
        control={control}
        name="loader"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Loader</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select loader." />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="vanilla">Vanilla</SelectItem>
                <SelectItem value="forge">Forge</SelectItem>
                <SelectItem value="fabric">Fabric</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              What mod loader to use to load mods.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        name="console"
        control={control}
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
              <FormLabel>Console</FormLabel>
              <FormDescription>Display java terminal.</FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        name="disable_chat"
        control={control}
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
              <FormLabel>Disable chat</FormLabel>
              <FormDescription>Disable in game chat</FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        name="disable_mulitplayer"
        control={control}
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
              <FormLabel>Disable Mulitplayer</FormLabel>
              <FormDescription>
                Disable mulitplayer component of the game.
              </FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        name="is_demo"
        control={control}
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
              <FormLabel>Demo</FormLabel>
              <FormDescription>Run game in demo mode.</FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        name="gameDir"
        control={control}
        render={({ field: { value, ...field } }) => (
          <FormItem>
            <FormLabel>Game Directory</FormLabel>
            <FormControl>
              <Input
                value={value ?? ""}
                autoComplete="false"
                placeholder="Name"
                {...field}
              />
            </FormControl>
            <FormDescription>
              Where on your computer all the game files are put.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        name="javaDir"
        control={control}
        render={({ field: { value, ...field } }) => (
          <FormItem>
            <FormLabel>Java Directory</FormLabel>
            <FormControl>
              <Input
                value={value ?? ""}
                autoComplete="false"
                placeholder="Name"
                {...field}
              />
            </FormControl>
            <FormDescription>
              Where the java exec file are located.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        name="javaArgs"
        control={control}
        render={({ field: { value, ...field } }) => (
          <FormItem>
            <FormLabel>Java Arguments</FormLabel>
            <FormControl>
              <Input
                value={value ?? ""}
                autoComplete="false"
                placeholder="Java arguments"
                {...field}
              />
            </FormControl>
            <FormDescription>
              Command line flags that are passed to the java executable at game
              start.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {editMods ? (
        <FormField
          name="mods"
          control={control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mods</FormLabel>
              <FormControl>
                <ul className="space-y-1 pl-2">
                  {field.value
                    ? field.value.map(
                        (item: {
                          id: string;
                          name: string;
                          version: string;
                        }) => (
                          <li
                            key={item.id}
                            className="flex border-separate justify-between rounded-sm border border-zinc-800 p-2"
                          >
                            <div className="flex flex-col">
                              <h6>{item.name}</h6>
                              <TypographyMuted>{item.version}</TypographyMuted>
                            </div>
                            <Button
                              onClick={() => {
                                setValue(
                                  "mods",
                                  field.value.filter(
                                    (a: {
                                      id: string;
                                      name: string;
                                      version: string;
                                    }) => a.id !== item.id,
                                  ),
                                );
                              }}
                              size="icon"
                              variant="destructive"
                            >
                              <Trash />
                            </Button>
                          </li>
                        ),
                      )
                    : null}
                </ul>
              </FormControl>
              <FormDescription>Installed Mods</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}

      <div className="absolute bottom-4 right-4">
        <Button type="submit" className="sticky bottom-4 right-0">
          Save
        </Button>
      </div>
    </>
  );
};

export default ProfileModifyRoot;
