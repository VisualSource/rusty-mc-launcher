import debounce from "lodash.debounce";
import { memo, useCallback } from "react";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import searchManager, { type IndexType } from "@/lib/system/searchManager";
import { useSearch } from "@/hooks/useSearch";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export const SearchBar: React.FC = memo(() => {
	const search = useSearch();
	const queryHandler = useCallback(
		debounce(
			(
				ev:
					| React.FormEvent<HTMLFormElement>
					| React.ChangeEvent<HTMLInputElement>,
			) => {
				let query = "";
				if (ev.type === "submit") {
					const data = new FormData(ev.target as HTMLFormElement);
					query = data.get("query")?.toString() ?? "";
				} else {
					query = (ev.target as HTMLInputElement).value;
				}

				searchManager.setOffset(0).setQuery(query).update();
			},
			500,
		),
		[],
	);

	return (
		<header className="flex px-4 py-4">
			<search className="flex w-full gap-4 items-center">
				<form
					className="w-full"
					onSubmit={(ev) => {
						ev.preventDefault();
						queryHandler(ev);
					}}
				>
					<Input
						name="query"
						id="search-box"
						defaultValue={search.query}
						placeholder="Search..."
						onChange={queryHandler}
					/>
				</form>

				<Label className="text-nowrap">Sort By</Label>
				<Select
					defaultValue={search.index}
					onValueChange={(e: IndexType) => {
						searchManager.setIndex(e).setOffset(0).update();
					}}
				>
					<SelectTrigger className="w-48">
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

				<Label className="text-nowrap">Show pre page</Label>
				<Select
					defaultValue={search.limit.toString()}
					onValueChange={(e) => {
						searchManager.setLimit(Number.parseInt(e)).setOffset(0).update();
					}}
				>
					<SelectTrigger className="max-w-min">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="6">6</SelectItem>
						<SelectItem value="12">12</SelectItem>
						<SelectItem value="18">18</SelectItem>
						<SelectItem value="24">24</SelectItem>
						<SelectItem value="48">48</SelectItem>
						<SelectItem value="96">96</SelectItem>
					</SelectContent>
				</Select>
			</search>
		</header>
	);
});
SearchBar.displayName = "SearchBar";
