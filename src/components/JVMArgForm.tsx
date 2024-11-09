import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ControllerRenderProps } from "react-hook-form";
import { useSuspenseQuery } from "@tanstack/react-query";
import update from "immutability-helper";
import { Plus } from "lucide-react";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./ui/dialog";
import type { Profile } from "@/lib/models/profiles";
import { parseJVMArgs, argsToString } from "@/lib/JvmArgs";
import { MarkedSlider } from "@/components/ui/slider";
import { getSystemRam } from "@lib/api/plugins/content";
import { Separator } from "./ui/separator";
import { Button } from "./ui/button";
import { range } from "@/lib/range";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";

const TickedSilder: React.FC<{
	onValueChange: (value: number[]) => void;
	value: number[];
	min: number;
	max: number;
	disabled?: boolean;
}> = ({ min, max, disabled, value, onValueChange }) => {
	const tickRange = useMemo(() => range(min, max, 1), [min, max]);
	return (
		<div className="flex-grow items-center">
			<MarkedSlider
				onValueChange={onValueChange}
				value={value}
				disabled={disabled}
				min={min}
				max={max}
				step={1}
			/>
			<div className="mt-1.5 flex flex-row justify-between items-center relative">
				{tickRange.map((_, i) => (
					<span
						key={`maxMemory-${i + 2}`}
						className={cn("text-sm font-light text-center", {
							"text-10 opacity-40 h-5 w-5 select-none touch-none":
								i >= 0 && i < max,
						})}
						role="presentation"
					>
						{i % 4 === 0 ? i + min : "|"}
					</span>
				))}
			</div>
		</div>
	);
};

export const JVMArgForm: React.FC<{
	controller: ControllerRenderProps<Profile>;
}> = ({ controller: { value, onChange } }) => {
	const { data: ram } = useSuspenseQuery({
		networkMode: "offlineFirst",
		refetchOnMount: false,
		refetchOnReconnect: false,
		refetchOnWindowFocus: false,
		queryKey: ["SYSTEM_RAM"],
		queryFn: () => getSystemRam(),
	});
	const ref = useRef<HTMLDivElement>(null);
	const [showDialog, setShowDialog] = useState(false);
	const [argValue, setArgValue] = useState("");
	const [_, setHistory] = useState<{ index: number; value: string }[]>([]);
	const [state, setState] = useState(() => parseJVMArgs(value));

	const change = useCallback(
		(data: ReturnType<typeof parseJVMArgs>) => {
			onChange(argsToString(data));
			ref.current?.dispatchEvent(new Event("change", { bubbles: true }));
		},
		[onChange],
	);

	useEffect(() => {
		const callback = (ev: KeyboardEvent) => {
			if (!ev.ctrlKey) return;
			switch (ev.code) {
				case "KeyZ": {
					setHistory((e) => {
						if (!e.length) return e;
						const target = e.pop();
						if (!target) return e;
						setState((d) => {
							const data = update(d, {
								args: { $splice: [[target.index, 0, target.value]] },
							});
							change(data);
							return data;
						});
						return [...e];
					});
					break;
				}
			}
		};
		window.addEventListener("keypress", callback);
		return () => {
			window.removeEventListener("keypress", callback);
		};
	}, [change]);

	return (
		<div className="space-y-4" ref={ref}>
			<Separator />
			<div className="flex gap-4 items-center mb-8">
				<Label>Max Memory</Label>
				<TickedSilder
					value={state.memory}
					onValueChange={(v) =>
						setState((e) => {
							const data = update(e, { memory: { $set: v } });
							change(data);
							return data;
						})
					}
					min={2}
					max={ram - 5}
				/>
			</div>

			<div className="space-y-4 mt-4">
				<div className="flex justify-between items-center">
					<Label>Other Jvm Args</Label>
					<Dialog onOpenChange={setShowDialog} open={showDialog}>
						<DialogTrigger asChild>
							<Button type="button" size="sm">
								{" "}
								<Plus className="h-4 w-4" /> Add
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Add Arg</DialogTitle>
								<DialogDescription>
									New argument to pass to the jvm
								</DialogDescription>
							</DialogHeader>
							<Input
								value={argValue}
								onChange={(e) => setArgValue(e.target.value)}
								placeholder="-XX:+UseG1GC"
							/>
							<DialogFooter>
								<Button
									type="button"
									onClick={() => {
										setState((e) => {
											const data = update(e, { args: { $push: [argValue] } });
											change(data);
											return data;
										});
										setArgValue("");
										setShowDialog(false);
									}}
								>
									Ok
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>

				<div className="flex flex-wrap gap-2">
					{state.args.map((e, i) => (
						<Badge
							onClick={() => {
								setState((s) => {
									const idx = s.args.indexOf(e);
									if (idx === -1) return s;
									setHistory((e) => [...e, { index: idx, value: s.args[idx] }]);
									const data = update(s, { args: { $splice: [[idx, 1]] } });
									change(data);
									return data;
								});
							}}
							className="select-none cursor-alias"
							key={`${i + 1}`}
						>
							{e}
						</Badge>
					))}
				</div>
			</div>
		</div>
	);
};
