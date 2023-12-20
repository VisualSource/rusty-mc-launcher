import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { coerce, satisfies } from "semver";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { useProfiles } from "@/lib/hooks/useProfiles";
import { getLoaderType } from "@/utils/versionUtils";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Book } from "lucide-react";

const FormSchema = z.object({
    showAll: z.boolean(),
    profile: z.string().uuid()
});

const KEY = "mcl::open::profile-select";
const RETURN_KEY = "mcl::return::profile-select";

export const selectProfile = async (limit?: { modloaders?: string[]; minecraft_versions?: string[] }): Promise<string | null> => {
    return new Promise((resolve) => {
        window.addEventListener(RETURN_KEY, (ev) => {
            const { id } = (ev as CustomEvent<{ id: string | null }>).detail;
            resolve(id);
        }, { once: true });


        window.dispatchEvent(new CustomEvent(KEY, { detail: limit }))
    });
}

const SelectProfile: React.FC = () => {
    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            showAll: false,
            profile: undefined
        }
    });

    const showAll = form.watch("showAll");

    const profiles = useProfiles();
    const [config, setConfig] = useState<null | { modloaders?: string[]; minecraft_versions?: string[] }>(null);
    const [isOpen, setOpen] = useState<boolean>(false);

    const avaliable = useMemo(() => {
        if (!config) return profiles;

        if (showAll) {
            return profiles.filter((item) => {
                const { type } = getLoaderType(item.lastVersionId);
                return config.modloaders ? config.modloaders.includes(type) : true;
            });
        }

        return profiles.filter((item) => {
            const { type, game } = getLoaderType(item.lastVersionId);

            const version = coerce(game);

            const allowed = config.minecraft_versions ? config.minecraft_versions.some(value => {
                if (!version) return false;
                return satisfies(version, value);
            }) : true;

            const loader = config.modloaders ? config.modloaders.includes(type) : true;

            return allowed && loader;
        });
    }, [config, profiles, showAll]);

    useEffect(() => {
        const handle = (ev: Event) => {
            const data = (ev as CustomEvent<{ modloaders?: string[]; minecraft_versions?: string[] }>).detail;
            setConfig(data ?? null);
            setOpen(true);
        }

        window.addEventListener(KEY, handle);

        return () => {
            window.removeEventListener(KEY, handle);
        }

    }, []);

    const onSubmit = (ev: z.infer<typeof FormSchema>) => {
        window.dispatchEvent(new CustomEvent(RETURN_KEY, { detail: { id: ev.profile ?? null } }));
        setOpen(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={(state) => {
            setOpen(state);
            if (!state) {
                window.dispatchEvent(new CustomEvent(RETURN_KEY, { detail: { id: null } }));
            }

            form.reset();
        }}>
            <DialogContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="text-zinc-50">
                        <DialogHeader>
                            <DialogTitle>Select Profile</DialogTitle>
                        </DialogHeader>
                        <div className="flex items-center space-x-2 py-4">
                            <div className="grid flex-1 gap-2">
                                <FormField control={form.control} name="profile" render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Minecraft Version</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button variant="outline" role="checkbox" className={cn({ "text-muted-foreground": !field.value })}>
                                                        {field.value ? avaliable.find(value => value.id === field.value)?.name : "Select Version"}
                                                        <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent>
                                                <Command>
                                                    <CommandInput placeholder="Search Versions..." className="h-9" />
                                                    <CommandEmpty>No version found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {avaliable.map((value) => (
                                                            <CommandItem key={value.id} value={value.id} onSelect={() => {
                                                                form.setValue("profile", value.id);
                                                            }}>
                                                                <Avatar>
                                                                    <AvatarFallback>
                                                                        <Book />
                                                                    </AvatarFallback>
                                                                    <AvatarImage src={value.icon ?? undefined} />
                                                                </Avatar>
                                                                <span className="line-clamp-1 pl-2">{value.name}</span>
                                                                <CheckIcon
                                                                    className={cn(
                                                                        "ml-auto h-4 w-4",
                                                                        value.id === field.value
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
                                            The version of minecraft you want to use.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                {config?.minecraft_versions?.length && config.modloaders?.length ? (
                                    <FormField
                                        control={form.control}
                                        name="showAll"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <div className="space-y-1 leading-none">
                                                    <FormLabel>
                                                        Show all profiles.
                                                    </FormLabel>
                                                    <FormDescription>
                                                        Show all profiles regardless of minecraft version.
                                                    </FormDescription>
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                ) : null}

                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">Select</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default SelectProfile;