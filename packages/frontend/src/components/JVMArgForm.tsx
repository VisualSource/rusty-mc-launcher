import { Suspense, useCallback, useRef, useState } from "react";
import type { ControllerRenderProps } from "react-hook-form";
import update, { type Spec } from "immutability-helper";
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
import { MemorySlider } from "./ui/memory-slider";
import { Separator } from "./ui/separator";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";

export const JVMArgForm: React.FC<{
	controller: ControllerRenderProps<Profile>;
}> = ({ controller: { value, onChange } }) => {
	const ref = useRef<HTMLDivElement>(null);
	const [showDialog, setShowDialog] = useState(false);
	const [argValue, setArgValue] = useState("");
	const [state, setState] = useState(() => parseJVMArgs(value));

	const change = useCallback(
		(s: ReturnType<typeof parseJVMArgs>, action: Spec<{ memory: number[]; args: string[]; }, never>) => {
			const newData = update(s, action);
			setState(newData);
			onChange(argsToString(newData));
			ref.current?.dispatchEvent(new Event("change", { bubbles: true }));
		},
		[onChange],
	);

	return (
		<div className="space-y-4" ref={ref}>
			<Separator />
			<div className="flex flex-col gap-4 items-center mb-8">
				<Label className="text-left w-full">Max Memory</Label>

				<Suspense>
					<MemorySlider value={state.memory[0]} onChange={(v) => change(state, { memory: { $set: [v] } })} />
				</Suspense>
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
										change(state, { args: { $push: [argValue] } })
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

				<div className="flex flex-wrap gap-2 bg-input rounded-md shadow p-4">
					{state.args.map((e, i) => (
						<Badge
							onClick={() => {
								const idx = state.args.indexOf(e);
								if (idx === -1) return;
								change(state, { args: { $splice: [[idx, 1]] } });
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
