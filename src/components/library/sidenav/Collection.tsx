import {
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import useCategoryGroup from "@hook/useCategoryGroup";
import CollectionItem from "./CollectionItem";

const Collection: React.FC<{
	id: string | null;
	name: string;
}> = ({ id, name }) => {
	const collections = useCategoryGroup(id);

	return (
		<AccordionItem value={name} className="border-none">
			<AccordionTrigger className="flex w-full items-center bg-gradient-to-r from-zinc-700/95 from-10% to-zinc-800 px-1 py-0.5 text-zinc-50">
				<span className="inline-block text-xs w-1/2 @4xs/main:w-auto  @4xs/main:text-sm @3xs:text-base text-ellipsis overflow-hidden whitespace-nowrap">
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
};

export default Collection;
