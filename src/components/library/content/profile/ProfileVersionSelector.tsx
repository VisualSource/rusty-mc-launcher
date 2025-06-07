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
import type { Profile } from "@/lib/models/profiles";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BadgeHelp } from "lucide-react";

export const ProfileVersionSelector: React.FC<{
	isModpack: boolean;
	form: UseFormReturn<Profile>;
}> = ({ form, isModpack }) => {
	const [showSnapshots, setShowSnapshots] = useState(false);

	return (
		<>
			{isModpack ? (
				<Alert>
					<BadgeHelp className="h-4 w-4" />
					<AlertTitle>Settings Restricted</AlertTitle>
					<AlertDescription>
						Some game settings have been restricted due to this being a modpack.
					</AlertDescription>
				</Alert>
			) : null}
			<div className={cn("flex flex-col space-y-2", isModpack && "opacity-40")} inert={isModpack ? true : undefined}>
				<FormField
					disabled={isModpack}
					control={form.control}
					name="version"
					render={({ field }) => (
						<FormItem className="flex flex-col">
							<FormLabel>Minecraft Version</FormLabel>
							<FormControl className="w-full">
								<div className="flex w-full flex-col space-y-2">
									<VersionSelector
										disabled={field.disabled}
										onChange={field.onChange}
										defaultValue={field.value}
										type={showSnapshots ? "both" : "release"}
									/>
									<div className="flex items-center justify-between">
										<FormDescription>The version of the game.</FormDescription>
										<div className="flex items-center justify-end gap-2">
											<Checkbox
												disabled={isModpack}
												checked={showSnapshots}
												onCheckedChange={(e) => setShowSnapshots(e as boolean)}
											/>
											<Label>Show Snapshots</Label>
										</div>
									</div>
								</div>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					disabled={isModpack}
					control={form.control}
					name="loader"
					rules={{ required: { message: "A loader is required", value: true } }}
					render={({ field }) => (
						<FormItem>
							<FormLabel>Mod Loader</FormLabel>
							<FormControl>
								<Select
									disabled={field.disabled}
									value={field.value}
									onValueChange={field.onChange}
								>
									<SelectTrigger className="w-full">
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
								The loader that will be used to load mods. Note: vanilla does
								not support loading mods.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<LoaderVersionSelector
					disabled={isModpack}
					form={form}
					stable={showSnapshots}
				/>
			</div>
		</>
	);
};
