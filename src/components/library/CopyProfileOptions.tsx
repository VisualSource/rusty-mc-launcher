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
import type { Profile } from "@/lib/models/profiles";
import { useProfiles } from "@/hooks/useProfiles";

export const CopyProfileOptions: React.FC<{
	form: UseFormReturn<Profile & { copyOptions?: string }, unknown, undefined>;
}> = ({ form }) => {
	const profiles = useProfiles();

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
								<SelectTrigger>
									<SelectValue placeholder="Copy options from..." />
								</SelectTrigger>
								<SelectContent>
									{profiles.map((item) => (
										<SelectItem key={item.id} value={item.id}>
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
