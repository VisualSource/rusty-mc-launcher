import { Check, FilePlus2 } from "lucide-react";
import { useEffect, useReducer } from "react";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { Command, CommandEmpty, CommandItem, CommandList } from "../ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

const OPEN_KEY = "rmcl://ask";
const RETURN_KEY = "rmcl://ask/return";

type AskItem = {
	id: string;
	name: string;
	icon?: string;
};
type Option = { id: string; value: boolean };

type Config = {
	title: string;
	description: string;
	empty: string;
	multi: boolean;
	options: AskItem[];
};

export const askFor = (config: Config) => {
	return new Promise<Option[]>((resolve) => {
		window.addEventListener(
			RETURN_KEY,
			(ev) => {
				const result = (ev as CustomEvent<Option[]>).detail;
				resolve(result);
			},
			{ once: true },
		);
		window.dispatchEvent(new CustomEvent(OPEN_KEY, { detail: config }));
	});
};

type State = {
	open: boolean;
	values: Option[];
} & Config;
type Action =
	| {
			type: "open";
			value: boolean;
	  }
	| { type: "reset"; value: State }
	| { type: "value"; value: Option[] };

const reducer = (state: State, action: Action) => {
	switch (action.type) {
		case "open":
			return {
				...state,
				open: action.value,
			};
		case "reset":
			return action.value;
		case "value":
			return {
				...state,
				values: action.value,
			};
		default:
			return state;
	}
};

const initState: State = {
	empty: "No Item found",
	title: "Ask Dialog",
	description: "Ask to select",
	multi: true,
	open: false,
	options: [],
	values: [],
};

const AskDialog: React.FC = () => {
	const [state, dispatch] = useReducer(reducer, initState);

	useEffect(() => {
		const callback = (ev: Event) => {
			const config = (ev as CustomEvent<Config>).detail;
			dispatch({ type: "reset", value: { open: true, values: [], ...config } });
		};
		window.addEventListener(OPEN_KEY, callback);
		return () => {
			window.removeEventListener(OPEN_KEY, callback);
		};
	}, []);

	return (
		<Dialog
			open={state.open}
			onOpenChange={(e) => {
				dispatch({ type: "open", value: e });
				window.dispatchEvent(new CustomEvent(RETURN_KEY, { detail: [] }));
			}}
		>
			<DialogContent className="text-white">
				<DialogHeader>
					<DialogTitle>{state.title}</DialogTitle>
					<DialogDescription>{state.description}</DialogDescription>
				</DialogHeader>
				<Command>
					<CommandEmpty>{state.empty}</CommandEmpty>
					<CommandList className="scrollbar max-h-56">
						{state.options.map((item) => (
							<CommandItem
								className={cn({
									"bg-zinc-400 bg-opacity-50": state.values.find(
										(e) => e.id === item.id,
									)?.value,
								})}
								key={item.id}
								value={item.id}
								onSelect={(currentValue) => {
									if (!state.multi) {
										if (
											state.values.findIndex((e) => e.id === currentValue) ===
											-1
										) {
											dispatch({
												type: "value",
												value: [{ id: currentValue, value: true }],
											});
										} else {
											dispatch({ type: "value", value: [] });
										}
										return;
									}

									const isActive =
										state.values.findIndex((e) => e.id === currentValue) !== -1;

									if (isActive) {
										dispatch({
											type: "value",
											value: state.values.filter((e) => e.id !== currentValue),
										});
									} else {
										dispatch({
											type: "value",
											value: [
												...state.values,
												{ id: currentValue, value: true },
											],
										});
									}
								}}
							>
								<Avatar>
									<AvatarFallback>
										<FilePlus2 />
									</AvatarFallback>
									<AvatarImage src={item.icon} />
								</Avatar>
								<h2 className="ml-2 font-bold">{item.name}</h2>
								<Check
									className={cn(
										"ml-auto",
										state.values.find((e) => e.id === item.id)?.value
											? "opacity-100"
											: "opacity-0",
									)}
								/>
							</CommandItem>
						))}
					</CommandList>
				</Command>
				<DialogFooter>
					<Button
						type="button"
						onClick={() => {
							dispatch({ type: "open", value: false });
							window.dispatchEvent(
								new CustomEvent(RETURN_KEY, { detail: state.values }),
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

export default AskDialog;
