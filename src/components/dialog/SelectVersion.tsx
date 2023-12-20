import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from 'zod';

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "../ui/command";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

const FormSchema = z.object({
    game: z.string({
        required_error: "Please select a version"
    }).min(4),
    loader: z.string({
        required_error: "A modloader is required"
    }).min(4)
})

const KEY = "mcl::open::version-select";
const RETURN_KEY = "mcl::return::version-select";

export const selectVersion = async (target: { modloaders: string[]; minecraft_versions: string[] }): Promise<{ game: string; loader: string; } | null> => {
    return new Promise((resolve) => {
        window.addEventListener(RETURN_KEY, (ev) => {
            const data = (ev as CustomEvent<{ game: string; loader: string; } | null>).detail;
            resolve(data);
        }, { once: true });

        window.dispatchEvent(new CustomEvent(KEY, { detail: target }));
    });
}

const SelectVersionDialog: React.FC = () => {
    const [mcPopover, setMCPopover] = useState(false);
    const [loaderPopover, setLoaderPopover] = useState(false);
    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            loader: "",
            game: ""
        }
    });
    const [config, setConfig] = useState<{ modloaders: string[]; minecraft_versions: string[] }>({ modloaders: [], minecraft_versions: [] });
    const [isOpen, setOpen] = useState<boolean>(false);

    useEffect(() => {
        const handle = (ev: Event) => {
            const data = (ev as CustomEvent<{ modloaders: string[]; minecraft_versions: string[] }>).detail;
            console.log(data);
            setConfig(data);
            setOpen(true);
        }

        window.addEventListener(KEY, handle);

        return () => {
            window.removeEventListener(KEY, handle);
        }

    }, []);

    const handleSubmit = (ev: z.infer<typeof FormSchema>) => {
        window.dispatchEvent(new CustomEvent(RETURN_KEY, { detail: ev }));
        setOpen(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={(state) => {
            setOpen(state);

            if (!state) {
                window.dispatchEvent(new CustomEvent(RETURN_KEY, { detail: null }));
            }

            form.reset();

        }}>
            <DialogContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="text-zinc-50">
                        <DialogHeader>
                            <DialogTitle>Install</DialogTitle>
                        </DialogHeader>
                        <div className="flex items-center space-x-2">
                            <div className="grid flex-1 gap-2">
                                <FormField control={form.control} name="game" render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Minecraft Version</FormLabel>
                                        <Popover onOpenChange={setMCPopover} open={mcPopover}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button variant="outline" role="checkbox" className={cn({ "text-muted-foreground": !field.value })}>
                                                        {field.value ? `Minecraft ${config.minecraft_versions.find(value => value === field.value)}` : "Select Version"}
                                                        <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent>
                                                <Command>
                                                    <CommandInput placeholder="Search Versions..." className="h-9" />
                                                    <CommandEmpty>No version found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {config.minecraft_versions.map((value) => (
                                                            <CommandItem key={value} value={value} onSelect={() => {
                                                                form.setValue("game", value);
                                                                setMCPopover(false);
                                                            }}>
                                                                {value}
                                                                <CheckIcon
                                                                    className={cn(
                                                                        "ml-auto h-4 w-4",
                                                                        value === field.value
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

                                <FormField control={form.control} name="loader" render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>ModLoader</FormLabel>
                                        <Popover onOpenChange={setLoaderPopover} open={loaderPopover}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button variant="outline" role="checkbox" className={cn({ "text-muted-foreground": !field.value })}>
                                                        {field.value ? config.modloaders.find(value => value === field.value) : "Select Modloader"}
                                                        <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="p-0">
                                                <Command>
                                                    <CommandInput placeholder="Search Modloaders..." className="h-9" />
                                                    <CommandEmpty>No loader found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {config.modloaders.map((value) => (
                                                            <CommandItem key={value} value={value} onSelect={() => {
                                                                form.setValue("loader", value);
                                                                setLoaderPopover(false);
                                                            }}>
                                                                {value}
                                                                <CheckIcon
                                                                    className={cn(
                                                                        "ml-auto h-4 w-4",
                                                                        value === field.value
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
                                            The Mod loader that is to be using to load mod.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )} />
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

export default SelectVersionDialog;