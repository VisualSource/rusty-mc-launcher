import type { UseFormReturn } from "react-hook-form";
import { Layers3 } from "lucide-react";
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../ui/form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Profile } from "@/lib/models/profiles";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getConfig } from "@/lib/models/settings";
import { query } from "@/lib/api/plugins/query";
import { join } from "@tauri-apps/api/path";

export const CopyProfileOptions: React.FC<{
	form: UseFormReturn<Profile & { copyOptions?: string }, unknown, undefined>;
}> = ({ form }) => {
	const { data } = useSuspenseQuery({
		queryKey: ["COPY_FROM_OPTIONS"],
		queryFn: async () => {
			const [globalCopyFrom, profileDirectory, profiles] = await Promise.all([
				getConfig("option.copy_settings_from").then((e) => e?.value),
				getConfig("path.app").then((e) => e?.value),
				query`SELECT * FROM profiles;`.as(Profile).all(),
			]);

			if (!profileDirectory) throw new Error("Missing profiles directory!");

			const paths = await Promise.all(
				profiles.map(async (e) => {
					const path = await join(
						profileDirectory,
						"profiles",
						e.id,
						"options.txt",
					);
					return { name: e.name, icon: e.icon, path };
				}),
			);

			if (globalCopyFrom) {
				paths.unshift({
					path: globalCopyFrom,
					name: "Global Options",
					icon: null,
				});
			}

			return paths;
		},
	});

	return (
		<div className="flex flex-col space-y-2">
			<FormField
				control={form.control}
				name="copyOptions"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Copy Profile Options</FormLabel>
						<FormControl>
							<Select value={field.value} onValueChange={field.onChange}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Copy options from..." />
								</SelectTrigger>
								<SelectContent>
									{!data.length ? (
										<SelectItem disabled value="null">
											<span>No Options</span>
										</SelectItem>
									) : null}
									{data.map((item, i) => (
										<SelectItem key={`Copy-Option-${i + 1}`} value={item.path}>
											<div className="flex items-center gap-2">
												<Avatar className="h-4 w-4">
													<AvatarFallback>
														<Layers3 />
													</AvatarFallback>
													<AvatarImage src={item.icon ?? undefined} />
												</Avatar>
												<span className="line-clamp-1">{item.name}</span>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</FormControl>
						<FormDescription>
							Copy the options.txt from another profile.
						</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
		</div>
	);
};
