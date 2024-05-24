import { type UseFormReturn, useFormContext } from "react-hook-form";
import { useState } from "react";

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VersionSelector } from "@/components/ui/VersionSelector";
import { MinecraftProfile } from "@/lib/models/profiles";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export const ProfileVersionSelector: React.FC<{ form: UseFormReturn<MinecraftProfile, any, undefined> }> = ({ form }) => {
    const [showSnapshots, setShowSnapshots] = useState(false);
    const method = useFormContext();
    const currentLoader = method.watch("loader");

    return (
        <div className="flex flex-col space-y-2">
            <FormField control={form.control} name="version" render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Minecraft Version</FormLabel>
                    <FormControl className="w-full">
                        <div className="w-full flex flex-col space-y-2">
                            <VersionSelector onChange={field.onChange} defaultValue={field.value} type={showSnapshots ? "both" : "release"} />
                            <div className="flex gap-2 items-center justify-end">
                                <Checkbox checked={showSnapshots} onCheckedChange={(e) => setShowSnapshots(e as boolean)} />
                                <Label>Show Snapshots</Label>
                            </div>
                        </div>
                    </FormControl>
                    <FormDescription>
                        The version of the game.
                    </FormDescription>
                    <FormMessage />
                </FormItem>
            )} />


            <FormField control={form.control} name="loader" render={({ field }) => (
                <FormItem>
                    <FormLabel>Mod Loader</FormLabel>
                    <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="vanilla">Vanilla</SelectItem>
                                <SelectItem value="fabric">Fabric</SelectItem>
                                <SelectItem value="forge">Forge</SelectItem>
                                <SelectItem value="quilt">Quilt</SelectItem>
                            </SelectContent>
                        </Select>
                    </FormControl>
                    <FormDescription>
                        The loader that will be used to load mods. Note: vanilla does not support loading mods.
                    </FormDescription>
                    <FormMessage />
                </FormItem>
            )} />
            {currentLoader !== "vanilla" ? (
                <FormField control={form.control} name="loader_version" render={() => (
                    <FormItem>
                        <FormLabel>Loader Version</FormLabel>
                        <FormControl>

                        </FormControl>
                        <FormDescription>
                            The loader version to use.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )} />
            ) : null}
        </div>
    );
}