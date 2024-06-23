import { useFetcher, useLoaderData } from "react-router-dom";
import { Plus } from "lucide-react";
import { useState } from "react";

import {
	Dialog,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogContent,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Setting } from "@/lib/models/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CollectionItem from "./CollectionItem";

const CollectionsRoot: React.FC = () => {
	const [addCollectionOpen, setAddCollectionsOpen] = useState(false);
	const data = useLoaderData() as Setting[];
	const fetcher = useFetcher();

	return (
		<ScrollArea>
			<div className="flex flex-wrap gap-4 p-2">
				{data.map((collection) => (
					<CollectionItem key={collection.metadata} collection={collection} />
				))}
				<Dialog onOpenChange={setAddCollectionsOpen} open={addCollectionOpen}>
					<DialogTrigger asChild>
						<button
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
						<fetcher.Form
							onSubmit={() => setAddCollectionsOpen(false)}
							action="/collections"
							method="POST"
						>
							<div className="grid w-full items-center gap-1.5">
								<Label htmlFor="name">Collection name</Label>
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
								<Button type="submit">Create</Button>
							</div>
						</fetcher.Form>
					</DialogContent>
				</Dialog>
			</div>
		</ScrollArea>
	);
};

export default CollectionsRoot;
