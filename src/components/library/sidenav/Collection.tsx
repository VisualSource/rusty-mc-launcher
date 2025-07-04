import {
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import useCategoryGroup from "@hook/useCategoryGroup";
import CollectionItem from "./CollectionItem";
import { memo } from "react";

const Collection: React.FC<{
	id: string | null;
	name: string;
}> = memo(({ id, name }) => {
	const collections = useCategoryGroup(id);

	return (
		<AccordionItem value={name} className="border-none" >
			<AccordionTrigger className="flex w-full items-center bg-linear-to-r from-accent/40 from-10% to-accent px-1 py-0.5 text-foreground" >
				<span className="inline-block text-xs w-1/2 @4xs/main:w-auto @4xs/main:text-sm @3xs:text-base text-ellipsis overflow-hidden whitespace-nowrap">
					{name} ({collections.length})
				</span>
			</AccordionTrigger>
			<AccordionContent>
				<ul>
					{collections.map((value) => (
						<CollectionItem
							uuid={value.id}
							key={value.id}
							icon={value.icon ?? ""}
							name={value.name}
						/>
					))}
				</ul>
			</AccordionContent>
		</AccordionItem>
	);
});

Collection.displayName = "Collection";

export default Collection;
