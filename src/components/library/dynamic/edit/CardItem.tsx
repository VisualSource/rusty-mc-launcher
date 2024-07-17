import { ErrorBoundary } from "react-error-boundary";
import { memo, Suspense, useState } from "react";
import { Settings2, Trash2 } from "lucide-react";
import { useDrag, useDrop } from "react-dnd";

import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { type Card, ItemTypes, OPTIONS } from "../EditConsts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Item = { id: string; originalIndex: number };

export const CardItem: React.FC<{
	id: string;
	type: keyof typeof OPTIONS;
	writeState: () => void;
	deleteCard: (id: string) => void;
	findCard: (id: string) => { index: number; card: Card };
	moveRow: (id: string, atIndex: number) => void;
	updateCard: (id: string, key: Record<string, unknown>) => void;
}> = memo(
	({ type, id, moveRow, findCard, writeState, deleteCard, updateCard }) => {
		const [open, setOpen] = useState(false);
		const { card, index } = findCard(id);
		const [{ isDragging }, drag] = useDrag(
			() => ({
				options: {
					dropEffect: "move",
				},
				type: ItemTypes.CARD,
				item: { id, originalIndex: index },
				collect: (monitor) => ({
					isDragging: monitor.isDragging(),
				}),
				end: (item, monitor) => {
					const { id: droppedId, originalIndex } = item;
					const didDrop = monitor.didDrop();
					if (!didDrop) {
						moveRow(droppedId, originalIndex);
					}
				},
			}),
			[id, index, moveRow],
		);
		const [, drop] = useDrop(
			() => ({
				accept: ItemTypes.CARD,
				drop() {
					writeState();
				},
				hover({ id: draggedId }: Item) {
					if (draggedId !== id) {
						const { index: overIndex } = findCard(id);
						moveRow(draggedId, overIndex);
					}
				},
			}),
			[findCard, moveRow],
		);

		const Opts = OPTIONS[type]?.Opts;

		return (
			<div
				ref={(node) => drag(drop(node))}
				className={cn(
					"border-2 border-dashed px-3 py-2 cursor-move shadow flex justify-between items-center",
					isDragging ? "opacity-0" : "opacity-100",
				)}
			>
				<h1>{OPTIONS[type].title}</h1>
				<div className="flex items-center">
					{Opts ? (
						<Popover open={open} onOpenChange={setOpen}>
							<PopoverTrigger asChild>
								<Button size="sm" variant="ghost">
									<Settings2 className="h-4 w-4" />
								</Button>
							</PopoverTrigger>
							<PopoverContent align="end">
								<ErrorBoundary fallback={<div />}>
									<Suspense>
										<Opts
											card={card}
											updateCard={updateCard}
											setOpen={setOpen}
										/>
									</Suspense>
								</ErrorBoundary>
							</PopoverContent>
						</Popover>
					) : null}

					<Button
						onClick={() => deleteCard(id)}
						className="text-muted-foreground hover:text-white"
						variant="ghost"
						size="sm"
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			</div>
		);
	},
);
