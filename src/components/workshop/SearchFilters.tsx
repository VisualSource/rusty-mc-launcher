import { useSuspenseQueries } from "@tanstack/react-query";
import { memo, useMemo } from "react";

import {
	categoryList,
	loaderList,
	projectTypeList,
} from "@/lib/api/modrinth/sdk.gen";
import type { CategoryTag, LoaderTag } from "@/lib/api/modrinth/types.gen";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { TypographyH3, TypographyH4 } from "../ui/typography";
import searchManager from "@system/searchManager";
import { useSearch } from "@/hooks/useSearch";
import { Checkbox } from "../ui/checkbox";
import { Selectable } from "./Selectable";
import { Label } from "../ui/label";

const ALLOWED_MOD_LOADERS = ["forge", "fabric", "quilt", "neoforge"] as const;
const SHOW_LOADERS_ON = ["mod", "modpack", "shader"] as const;

function filterOn(name: string, list: LoaderTag[]): LoaderTag[] {
	if (name === "modpack" || name === "mod") {
		return list.filter((e) => ALLOWED_MOD_LOADERS.includes(e.name));
	}
	return list.filter((e) => e.supported_project_types.includes("shader"));
}

export const LoaderList: React.FC<{
	projectType: string;
	loaders: LoaderTag[];
}> = ({ loaders, projectType }) => {
	const search = useSearch();
	const data = useMemo(
		() => filterOn(projectType, loaders),
		[loaders, projectType],
	);

	return (
		<div className="space-y-2">
			<TypographyH3>Loaders</TypographyH3>
			<ul className="space-y-2">
				{data?.map((item) => (
					<Selectable
						key={item.name}
						name={item.name}
						icon={item.icon}
						checked={search.facets.hasLoader(item.name)}
						onChange={() => {
							searchManager.facets.toggleLoader(item.name);
							searchManager.update();
						}}
					/>
				))}
			</ul>
		</div>
	);
};

export const SearchFilters: React.FC = () => {
	const search = useSearch();

	const [categoires, modrinthLoaders, modrinthProjectTypes] =
		useSuspenseQueries({
			queries: [
				{
					queryKey: ["MODRINTH_TAGS_CATEGORIES"],
					queryFn: async () => {
						const { error, data, response } = await categoryList();
						if (error) throw error;
						if (!response.ok || !data)
							throw new Error("Failed to load categories", { cause: response });

						const headers = Object.groupBy(data, (e) => e.header);

						const output: Record<string, Record<string, CategoryTag[]>> = {};
						for (const [header, values] of Object.entries(headers)) {
							if (!values) continue;

							const groups: Record<string, CategoryTag[]> = {};
							for (const value of values) {
								if (!groups[value.project_type])
									groups[value.project_type] = [];
								groups[value.project_type].push(value);
							}

							output[header] = groups;
						}

						return output;
					},
				},
				{
					queryKey: ["MODRINTH_TAGS_LOADERS"],
					queryFn: async () => {
						const { data, error, response } = await loaderList();
						if (error) throw error;
						if (!response.ok || !data)
							throw new Error("Failed to load categories", { cause: response });
						return data;
					},
				},
				{
					queryKey: ["MODRINTH_TAGS_PROJECT_TYPES"],
					queryFn: async () => {
						const { data, error, response } = await projectTypeList();
						if (error) throw error;
						if (!response.ok || !data)
							throw new Error("Failed to load project types", {
								cause: response,
							});
						return data.filter((e) => !["plugin", "datapack"].includes(e));
					},
				},
			],
		});

	const projectType = search.facets.getProjectType();
	const showLoaders = search.facets.isAnyProject(SHOW_LOADERS_ON);
	const showEnv = search.facets.isAnyProject(["mod", "modpack"]);
	const items = useMemo(() => {
		return Object.entries(categoires.data).flatMap(([key, values]) =>
			Object.entries(values)
				.filter((item) => item[0] === projectType)
				.map(([_, item]) => ({
					key,
					title: key.replace(/^\w/, key[0].toUpperCase()),
					items: item.map((item) => ({
						name: item.name,
						icon: item.icon,
					})),
				})),
		);
	}, [projectType, categoires.data]);

	return (
		<>
			<div className="space-y-2">
				<TypographyH3>Project Type</TypographyH3>
				<RadioGroup
					defaultValue={search.facets.getDisplayProjectType()}
					onValueChange={(e) => {
						searchManager.facets.setProjectType(e);
						searchManager.setOffset(0).setQuery(undefined).update();
					}}
				>
					{modrinthProjectTypes.data?.map((item) => (
						<div key={item} className="flex items-center space-x-2">
							<RadioGroupItem value={item} id={`${item}_radio_opt`} />
							<Label htmlFor={`${item}_radio_opt`}>
								{item.replace(/^\w/, item[0].toUpperCase())}
							</Label>
						</div>
					))}
				</RadioGroup>
			</div>

			{items.map((header) => (
				<div key={header.key} className="space-y-2">
					<TypographyH3>{header.title}</TypographyH3>
					<ul className="space-y-2">
						{header.items.map((item) => (
							<Selectable
								key={item.name}
								name={item.name}
								icon={item.icon}
								checked={search.facets.hasCategory(item.name)}
								onChange={() => {
									searchManager.facets.toggleCategory(item.name);
									searchManager.update();
								}}
							/>
						))}
					</ul>
				</div>
			))}

			{showLoaders ? (
				<LoaderList projectType={projectType} loaders={modrinthLoaders.data} />
			) : null}

			{showEnv ? (
				<div className="space-y-2">
					<TypographyH4>Environments</TypographyH4>
					<ul className="space-y-2">
						<li className="flex items-center space-x-2">
							<Checkbox
								onClick={() => {
									searchManager.facets.toggleEnv("client");
									searchManager.update();
								}}
							/>
							<Label className="inline-flex items-center gap-1">
								<span className="inline-block h-4 w-4">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										stroke="currentColor"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										viewBox="0 0 24 24"
										aria-hidden="true"
									>
										<rect width="20" height="14" x="2" y="3" rx="2" ry="2" />
										<path d="M8 21h8m-4-4v4" />
									</svg>
								</span>
								Client
							</Label>
						</li>
						<li className="flex items-center space-x-2">
							<Checkbox
								onCheckedChange={() => {
									searchManager.facets.toggleEnv("server");
									searchManager.update();
								}}
							/>
							<Label className="inline-flex items-center gap-1">
								<span className="inline-block h-4 w-4">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										stroke="currentColor"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										viewBox="0 0 24 24"
										aria-hidden="true"
									>
										<path d="M22 12H2M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11M6 16h.01M10 16h.01" />
									</svg>
								</span>
								Server
							</Label>
						</li>
					</ul>
				</div>
			) : null}
		</>
	);
};
