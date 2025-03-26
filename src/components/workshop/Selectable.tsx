import { memo } from "react";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";

export const Selectable: React.FC<{
	checked: boolean;
	name: string;
	icon?: string;
	onChange: () => void;
}> = memo(({ onChange, name, icon, checked }) => {
	return (
		<li className="flex items-center space-x-2">
			<Checkbox checked={checked} onCheckedChange={onChange} />
			<Label className="inline-flex items-center gap-1">
				{icon ? (
					<span
						className="inline-block h-4 w-4"
						// biome-ignore lint/security/noDangerouslySetInnerHtml: thrid party icon
						dangerouslySetInnerHTML={{ __html: icon }}
					/>
				) : null}
				{name.replace(/^./, name[0].toUpperCase() ?? "")}
			</Label>
		</li>
	);
});
Selectable.displayName = "SelectableFilterItem";
