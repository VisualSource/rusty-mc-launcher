import { useQuery } from "@tanstack/react-query";
import { useEffect, useReducer } from "react";
import { Book, Check } from "lucide-react";

import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import {
	Command,
	CommandEmpty,
	CommandInput,
	CommandItem,
	CommandList,
	CommandLoading,
} from "../ui/command";
import { Profile } from "@/lib/models/profiles";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { query } from "@/lib/api/plugins/query";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

const KEY = "rmcl://select-profile";
const RETURN_KEY = "rmcl://select-profile/return";

export const selectProfile = async (filter?: {
	game?: string[];
	loaders?: string[];
}): Promise<Profile | null> => {
	return new Promise((resolve) => {
		window.addEventListener(
			RETURN_KEY,
			(ev) => {
				const profile = (ev as CustomEvent<Profile | null>).detail;
				resolve(profile);
			},
			{ once: true },
		);

		window.dispatchEvent(new CustomEvent(KEY, { detail: filter }));
	});
};

type State = {
	open: boolean;
	showAll: boolean;
	value: Profile | null;
	filter: {
		loaders: string[];
		game: string[];
	};
};

type Action =
	| { type: "all"; value: State }
	| { type: "showall"; value: boolean }
	| { type: "open"; value: boolean }
	| { type: "value"; value: Profile | null }
	| { type: "filter"; value: { game: string[]; loaders: string[] } };

const reducer = (state: State, payload: Action): State => {
	switch (payload.type) {
		case "all": {
			return payload.value;
		}
		case "showall":
			return {
				...state,
				showAll: payload.value,
			};
		case "filter":
			return {
				...state,
				filter: payload.value,
			};
		case "open":
			return {
				...state,
				open: payload.value,
			};
		case "value":
			return {
				...state,
				value: payload.value,
			};
		default:
			return state;
	}
};

const initState: State = {
	open: false,
	value: null,
	showAll: false,
	filter: { game: [], loaders: [] },
};

const SelectProfile: React.FC = () => {
	const [state, dispatch] = useReducer(reducer, initState);
	const { data, isLoading } = useQuery({
		queryKey: [
			"MINECRAFT_PROFILES",
			state.filter.game,
			state.filter.loaders,
			state.showAll,
		],
		queryFn: async () => {
			if (state.showAll) {
				return query("SELECT * FROM profiles").as(Profile).all();
			}
			return query(`SELECT * FROM profiles WHERE version IN (${state.filter.game.map((e) => `'${e}'`).join(", ")}) AND loader IN (${state.filter.loaders.map((e) => `'${e}'`).join(", ")})`).as(Profile).all();
		},
	});

	useEffect(() => {
		const callback = (ev: Event) => {
			const filter = (ev as CustomEvent<State["filter"]>).detail;
			dispatch({
				type: "all",
				value: {
					open: true,
					showAll: false,
					value: null,
					filter,
				},
			});
		};
		window.addEventListener(KEY, callback);
		return () => {
			window.removeEventListener(KEY, callback);
		};
	}, []);

	return (
		<Dialog
			open={state.open}
			onOpenChange={(e) => {
				window.dispatchEvent(new CustomEvent(RETURN_KEY, { detail: null }));
				dispatch({ type: "open", value: e });
			}}
		>
			<DialogContent className="text-white">
				<DialogHeader>
					<DialogTitle>Select Profile</DialogTitle>
				</DialogHeader>
				<Command>
					<CommandInput placeholder="Search Profile" />
					<CommandEmpty>No Profiles</CommandEmpty>
					{isLoading ? (
						<CommandLoading>Loading Profiles...</CommandLoading>
					) : null}
					<CommandList className="scrollbar max-h-72">
						{data?.map((profile) => (
							<CommandItem
								className={cn({
									"w-full bg-zinc-600 bg-opacity-50":
										state.value?.id === profile.id,
								})}
								key={profile.id}
								value={profile.id}
								onSelect={() => {
									dispatch({ type: "value", value: profile });
								}}
							>
								<div className="flex gap-1 py-2">
									<Avatar>
										<AvatarFallback>
											<Book />
										</AvatarFallback>
										<AvatarImage src={profile.icon ?? undefined} />
									</Avatar>
									<div className="flex flex-col">
										<h1>{profile.name}</h1>
										<div className="text-sm italic text-zinc-300">
											{profile.loader} {profile.version}
										</div>
									</div>
								</div>

								<Check
									className={cn(
										"ml-auto",
										state.value?.id === profile.id
											? "opaicty-100"
											: "opacity-0",
									)}
								/>
							</CommandItem>
						))}
					</CommandList>
				</Command>
				<div className="flex items-center justify-end space-x-2">
					<Checkbox
						checked={state.showAll}
						onCheckedChange={(e) =>
							dispatch({
								type: "showall",
								value: e === "indeterminate" ? false : e,
							})
						}
						id="terms"
					/>
					<label
						htmlFor="terms"
						className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
					>
						Show all
					</label>
				</div>
				<DialogFooter>
					<Button
						type="button"
						variant="secondary"
						onClick={() => {
							dispatch({ type: "open", value: false });
							window.dispatchEvent(
								new CustomEvent(RETURN_KEY, { detail: null }),
							);
						}}
					>
						Cancal
					</Button>
					<Button
						type="button"
						onClick={() => {
							dispatch({ type: "open", value: false });
							window.dispatchEvent(
								new CustomEvent(RETURN_KEY, { detail: state.value }),
							);
						}}
					>
						Ok
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default SelectProfile;
