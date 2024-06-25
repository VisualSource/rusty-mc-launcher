import type { UseFormReturn } from "react-hook-form";
import { Check, ChevronsUpDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import {
	Command,
	CommandEmpty,
	CommandInput,
	CommandItem,
	CommandList,
	CommandLoading
} from "@/components/ui/command";
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import type { MinecraftProfile } from "@/lib/models/profiles";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FabricMetadata = {
	version: string;
	stable: boolean;
};
type QuiltMetadata = {
	version: string;
};

export const LoaderVersionSelector: React.FC<{
	form: UseFormReturn<MinecraftProfile, unknown, undefined>;
	stable: boolean;
}> = ({ stable, form }) => {
	const btn = useRef<HTMLButtonElement>(null);
	const [open, setOpen] = useState(false);
	const [loader, version] = form.watch(["loader", "version"]);
	const { data, isError, isLoading } = useQuery({
		enabled: loader !== "vanilla" && !!version,
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

					const output = [];
					const target = `${version}-`;
					for (const item of doc.querySelectorAll("version")) {
						if (item.textContent?.startsWith(version)) {
							output.push(item.textContent.replace(target, ""));
						}
					}

					return output;
				}
				case "neoforge": {
					const response = await fetch(
						"https://maven.neoforged.net/releases/net/neoforged/neoforge/maven-metadata.xml",
					);
					const data = await response.text();
					const parser = new DOMParser();
					const doc = parser.parseFromString(data, "application/xml");
					const errorNode = doc.querySelector("parseerror");
					if (errorNode) return [];

					const [_, minor, patch] = version.split(".");

					const output = [];
					const target = `${minor}.${patch.length ? patch : "0"}`;
					for (const item of doc.querySelectorAll("version")) {
						if (item.textContent?.startsWith(target)) {
							output.push(item.textContent);
						}
					}
					return output.toReversed();
				}
				default:
					throw new Error("There are no loader version for vanilla");
			}
		},
	});

	useEffect(() => {
		form.resetField("loader_version");
		if (loader === "vanilla") form.setValue("loader_version", null);
		btn.current?.dispatchEvent(new Event("change", { bubbles: true }));
	}, [loader, form]);

	if (loader === "vanilla") return null;
	return (
		<FormField
			defaultValue={data?.at(0)}
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
									ref={btn}
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
									<CommandList className="scrollbar">
										{isLoading ? (
											<CommandLoading>Loading versions...</CommandLoading>
										) : (
											<CommandEmpty>No versions found.</CommandEmpty>
										)}
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
													btn.current?.dispatchEvent(new Event("change", { bubbles: true }));
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
