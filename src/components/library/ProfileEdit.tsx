import { useLoaderData, useSubmit } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from 'zod';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import type { MinecraftProfile } from "@/lib/models/profiles";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import { ScrollArea } from "../ui/scroll-area";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import useMinecraftVersions from "@/lib/hooks/useMinecraftVersion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const schema = z.object({
    name: z.string().min(4, {
        message: "NAme must be at least 4 characters."
    })
}).passthrough();

const ProfileEdit: React.FC = () => {
    const data = useLoaderData() as MinecraftProfile;
    const submit = useSubmit();
    const form = useForm<MinecraftProfile>({
        resolver: zodResolver(schema),
        defaultValues: data
    });
    const loader = form.watch("loader");
    const minecraft_versions = useMinecraftVersions(loader);

    const onSubmit = (ev: MinecraftProfile) => {
        submit(ev as never as Record<string, string>, {
            method: "PATCH",
            encType: "application/json"
        });
    }

    return (
        <ScrollArea>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="h-full py-4 container space-y-8 text-zinc-50 flex flex-col">
                    <FormField name="name" control={form.control} render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input autoComplete="false" placeholder="Name" {...field} />
                            </FormControl>
                            <FormDescription>
                                Profile Name
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )} />

                    <FormField defaultValue="latest-release"
                        control={form.control}
                        name="lastVersionId"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Minecraft Version</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button disabled={minecraft_versions.isLoading}
                                                variant="outline"
                                                role="combobox"
                                                className={cn(
                                                    "justify-between",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value
                                                    ? minecraft_versions.data?.versions.find(
                                                        (language) => language.id === field.value
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
                                                    <CommandItem value={version.id} key={version.id} onSelect={() => {
                                                        form.setValue("lastVersionId", version.id)
                                                    }}>
                                                        {version.id}
                                                        <Check
                                                            className={cn(
                                                                "ml-auto h-4 w-4",
                                                                version.id === field.value
                                                                    ? "opacity-100"
                                                                    : "opacity-0"
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
                        control={form.control}
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

                    <FormField name="console" control={form.control} render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <FormLabel>Console</FormLabel>
                                <FormDescription>
                                    Display java terminal.
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )} />
                    <FormField name="disable_chat" control={form.control} render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <FormLabel>Disable chat</FormLabel>
                                <FormDescription>
                                    Disable in game chat
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )} />

                    <FormField name="disable_mulitplayer" control={form.control} render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <FormLabel>Disable Mulitplayer</FormLabel>
                                <FormDescription>
                                    Disable mulitplayer component of the game.
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )} />

                    <FormField name="is_demo" control={form.control} render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <FormLabel>Demo</FormLabel>
                                <FormDescription>
                                    Run game in demo mode.
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )} />

                    <FormField name="gameDir" control={form.control} render={({ field: { value, ...field } }) => (
                        <FormItem>
                            <FormLabel>Game Directory</FormLabel>
                            <FormControl>
                                <Input value={value ?? ""} autoComplete="false" placeholder="Name" {...field} />
                            </FormControl>
                            <FormDescription>
                                Where on your computer all the game files are put.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )} />

                    <FormField name="javaDir" control={form.control} render={({ field: { value, ...field } }) => (
                        <FormItem>
                            <FormLabel>Java Directory</FormLabel>
                            <FormControl>
                                <Input value={value ?? ""} autoComplete="false" placeholder="Name" {...field} />
                            </FormControl>
                            <FormDescription>
                                Where the java exec file are located.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )} />

                    <FormField name="javaArgs" control={form.control} render={({ field: { value, ...field } }) => (
                        <FormItem>
                            <FormLabel>Java Arguments</FormLabel>
                            <FormControl>
                                <Input value={value ?? ""} autoComplete="false" placeholder="Java arguments" {...field} />
                            </FormControl>
                            <FormDescription>
                                Command line flags that are passed to the java executable at game start.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )} />

                    <div className="absolute bottom-4 right-4">
                        <Button type="submit" className="sticky bottom-4 right-0">Save</Button>
                    </div>
                </form>
            </Form>
        </ScrollArea>
    );
}

export default ProfileEdit;