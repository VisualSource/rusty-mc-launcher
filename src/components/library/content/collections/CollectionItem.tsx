import { Trash2 } from "lucide-react";
import { useState } from "react";

import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { FAVORITES_GUID, UNCATEGORIZEDP_GUID } from "@/lib/models/categories";
import { TypographyH4, TypographyMuted } from "@/components/ui/typography";
import type { Setting } from "@/lib/models/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCategoriesMutation } from "@/hooks/useCategoriesMutation";

const DEFAULT_GROUP = [FAVORITES_GUID, UNCATEGORIZEDP_GUID];

const CollectionItem: React.FC<{
	collection: Setting;
}> = ({ collection }) => {
	const [open, setOpen] = useState(false);
	const mutation = useCategoriesMutation();

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<button
					className="flex aspect-square h-44 items-center justify-center rounded-lg bg-accent shadow-lg hover:scale-105"
					type="button"
				>
					<TypographyH4 className="line-clamp-3 text-wrap text-lg text-zinc-50">
						{collection.value}
					</TypographyH4>
				</button>
			</DialogTrigger>
			<DialogContent className="text-zinc-50">
				<DialogHeader>
					<DialogTitle>Edit Collection</DialogTitle>
				</DialogHeader>
				<form
					onSubmit={async (ev) => {
						ev.preventDefault();
						const name = new FormData(ev.target as HTMLFormElement).get("name");
						await mutation.mutateAsync({
							type: "PATCH",
							data: { id: collection.metadata, name },
						});
						setOpen(false);
					}}
				>
					{collection.metadata &&
					DEFAULT_GROUP.includes(collection.metadata) ? (
						<div className="mb-4">
							<TypographyMuted>This colletion is not editable.</TypographyMuted>
						</div>
					) : (
						<div className="mb-4 grid w-full items-center gap-1.5">
							<Label htmlFor="name">Collection name</Label>
							<Input
								autoComplete="false"
								defaultValue={collection.value}
								id="name"
								name="name"
								placeholder="Collection name"
								required
								min={1}
								minLength={1}
							/>
						</div>
					)}
					{collection.metadata &&
					DEFAULT_GROUP.includes(collection.metadata) ? null : (
						<DialogFooter>
							<div className="flex w-full justify-between">
								<Button
									disabled={mutation.isPending}
									onClick={async () => {
										await mutation.mutateAsync({
											type: "DELETE",
											data: { id: collection.metadata },
										});
										setOpen(false);
									}}
									title="Delete Collection"
									type="button"
									variant="destructive"
									size="icon"
								>
									<Trash2 />
								</Button>
								<Button disabled={mutation.isPending} type="submit">
									Save
								</Button>
							</div>
						</DialogFooter>
					)}
				</form>
			</DialogContent>
		</Dialog>
	);
};

export default CollectionItem;
