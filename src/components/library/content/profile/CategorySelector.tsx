import { useQuery } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { Check } from "lucide-react";

import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandLoading
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import useCategoryMutation from "@/hooks/useCategoryMutation";
import { categories } from "@/lib/models/categories";
import useCategories from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CategorySelect: React.FC<{ profile: string }> = ({ profile }) => {
	return (
		<Suspense>
			<CategorySelectCore profile={profile} />
		</Suspense>
	);
};

const KEY_PROFILE_COLLECTION = "PROFILE_COLLECTION";

const CategorySelectCore: React.FC<{ profile: string }> = ({ profile }) => {
	const categoryList = useCategories();
	const mutate = useCategoryMutation();

	const { data, isLoading } = useQuery({
		queryKey: [KEY_PROFILE_COLLECTION, profile],
		queryFn: () => categories.getCategoriesForProfile(profile)
	});
	const [open, setOpen] = useState(false);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="secondary"
					className="w-full justify-start gap-2"
					type="button"
				>
					{data?.length ? (
						<>
							{data.map((item) => (
								<Badge variant="default" key={item.id}>
									{
										categoryList.find((e) => e.metadata === item.category)
											?.value
									}
								</Badge>
							))}
						</>
					) : (
						<>Select Categories</>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent>
				<Command>
					<CommandInput placeholder="Add to collection" />
					<CommandList>
						<CommandEmpty>No collection found</CommandEmpty>
						{isLoading ? (
							<CommandLoading>Loading collections...</CommandLoading>
						) : null}
						<CommandGroup>
							{categoryList.map((category) => (
								<CommandItem
									value={category.metadata ?? undefined}
									onSelect={(currentValue) => {
										const action =
											data?.findIndex((e) => e.category === currentValue) === -1
												? "add"
												: "remove";

										if (data?.length === 1 && action === "remove") {
											return;
										}

										mutate.mutateAsync({
											type: action,
											category: currentValue,
											profile,
										});
									}}
									key={category.metadata}
								>
									<Check
										className={cn(
											"mr-2 h-4 w-4",
											data?.findIndex(
												(e) => e.category === category.metadata,
											) === -1
												? "opacity-0"
												: "opacity-100",
										)}
									/>
									{category.value}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
};

export default CategorySelect;
