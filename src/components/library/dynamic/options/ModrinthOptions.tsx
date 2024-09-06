import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { OptsProps } from "../EditConsts";

function ModrinthOptions({ card, updateCard }: OptsProps) {
	return (
		<div className="grid gap-4">
			<div className="space-y-2">
				<h4 className="font-medium leading-none">Workshop Display</h4>
				<p className="text-sm text-muted-foreground">
					Options for Modrinth workshop content
				</p>
			</div>
			<div className="grid gap-2">
				<div className="grid grid-cols-3 items-center gap-4">
					<Label htmlFor="content">Content</Label>
					<Select
						defaultValue={card.params.content}
						onValueChange={(value) =>
							updateCard(card.id, {
								params: {
									content: { $set: value },
								},
							})
						}
					>
						<SelectTrigger className="col-span-2">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="modpack">Modpacks</SelectItem>
							<SelectItem value="mod">Mods</SelectItem>
							<SelectItem value="resourcepack">Resource Packs</SelectItem>
							<SelectItem value="shaderpack">Shader Packs</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="grid grid-cols-3 items-center gap-4">
					<Label htmlFor="sortBy">Sort By</Label>
					<Select
						onValueChange={(value) =>
							updateCard(card.id, {
								params: {
									sort: { $set: value },
								},
							})
						}
						defaultValue={card.params.sort}
					>
						<SelectTrigger className="col-span-2">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="relevance">Relevance</SelectItem>
							<SelectItem value="downloads">Downloads</SelectItem>
							<SelectItem value="follows">Follows</SelectItem>
							<SelectItem value="newest">Newest</SelectItem>
							<SelectItem value="updated">Updated</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>
		</div>
	);
}

export default ModrinthOptions;
