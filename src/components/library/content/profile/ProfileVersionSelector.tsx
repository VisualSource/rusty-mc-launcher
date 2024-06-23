import type { UseFormReturn } from "react-hook-form";
import { useState } from "react";

import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { VersionSelector } from "@/components/ui/VersionSelector";
import { LoaderVersionSelector } from "./LoaderVersionSelector";
import type { MinecraftProfile } from "@/lib/models/profiles";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export const ProfileVersionSelector: React.FC<{
	form: UseFormReturn<MinecraftProfile, any, undefined>;
}> = ({ form }) => {
	const [showSnapshots, setShowSnapshots] = useState(false);

	return (
		<div className="flex flex-col space-y-2">
			<FormField
				control={form.control}
				name="version"
				render={({ field }) => (
					<FormItem className="flex flex-col">
						<FormLabel>Minecraft Version</FormLabel>
						<FormControl className="w-full">
							<div className="flex w-full flex-col space-y-2">
								<VersionSelector
									onChange={field.onChange}
									defaultValue={field.value}
									type={showSnapshots ? "both" : "release"}
								/>
								<div className="flex items-center justify-end gap-2">
									<Checkbox
										checked={showSnapshots}
										onCheckedChange={(e) => setShowSnapshots(e as boolean)}
									/>
									<Label>Show Snapshots</Label>
								</div>
							</div>
						</FormControl>
						<FormDescription>The version of the game.</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name="loader"
				render={({ field }) => (
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
									<SelectItem value="quilt">Quilt</SelectItem>
									<SelectItem value="forge">Forge</SelectItem>
									<SelectItem value="neoforge">NeoForge</SelectItem>
								</SelectContent>
							</Select>
						</FormControl>
						<FormDescription>
							The loader that will be used to load mods. Note: vanilla does not
							support loading mods.
						</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>

			<LoaderVersionSelector form={form} stable={showSnapshots} />
		</div>
	);
};
