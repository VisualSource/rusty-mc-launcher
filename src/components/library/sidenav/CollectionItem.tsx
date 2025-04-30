import { Link } from "@tanstack/react-router";
import { Layers3 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@component/ui/avatar";

const CollectionItem: React.FC<{
	uuid: string;
	name: string;
	icon: string;
}> = ({ uuid, name, icon }) => {
	return (
		<li className="py-1 pl-3 pr-1 text-foreground hover:bg-accent/30 @4xs/main:pl-5">
			<Link
				to="/profile/$id"
				params={{ id: uuid }}
				className="flex items-center gap-2"
			>
				<Avatar className="h-5 w-5 rounded-none">
					<AvatarImage className="rounded-none" src={icon} />
					<AvatarFallback className="rounded-none">
						<Layers3 />
					</AvatarFallback>
				</Avatar>
				<span className="line-clamp-1">
					{name}
				</span>
			</Link>
		</li>
	);
};

export default CollectionItem;
