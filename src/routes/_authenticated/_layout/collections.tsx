import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import CollectionItem from "@/components/library/content/collections/CollectionItem";
import useCategories, { categoriesQueryOptions } from "@/hooks/useCategories";
import { useCategoriesMutation } from "@/hooks/useCategoriesMutation";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/Loading";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/_layout/collections")({
	component: Collections,
	loader: (opts) =>
		opts.context.queryClient.ensureQueryData(categoriesQueryOptions),
	pendingComponent: Loading,
});

function Collections() {
	const [addCollectionOpen, setAddCollectionsOpen] = useState(false);
	const categories = useCategories();
	const mutation = useCategoriesMutation();

	return (
		<div className="flex flex-wrap gap-4 p-2 overflow-y-scroll scrollbar">
			{categories.map((collection) => (
				<CollectionItem key={collection.metadata} collection={collection} />
			))}
			<Dialog onOpenChange={setAddCollectionsOpen} open={addCollectionOpen}>
				<DialogTrigger asChild>
					<button
						type="button"
						className="flex aspect-square h-44 items-center justify-center rounded-md bg-zinc-800 shadow-lg hover:bg-slate-800"
						title="Add Collection"
					>
						<Plus className="h-12 w-12 text-zinc-50" />
					</button>
				</DialogTrigger>
				<DialogContent className="text-zinc-50">
					<DialogHeader>
						<DialogTitle>Create Collection</DialogTitle>
					</DialogHeader>
					<form
						onSubmit={async (ev) => {
							ev.preventDefault();
							const name = new FormData(ev.target as HTMLFormElement).get(
								"name",
							);
							await mutation.mutateAsync({ type: "POST", data: { name } });
							setAddCollectionsOpen(false);
						}}
					>
						<div className="grid w-full items-center gap-1.5">
							<Label>Collection name</Label>
							<Input
								autoComplete="false"
								id="name"
								name="name"
								placeholder="Collection name"
								required
								min={1}
								minLength={1}
							/>
						</div>
						<div className="flex justify-end pt-4">
							<Button type="submit" disabled={mutation.isPending}>
								{mutation.isPending ? "Loading..." : null} Create
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
