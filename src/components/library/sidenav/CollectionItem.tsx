import { Link } from "react-router-dom";
import { Book } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@component/ui/avatar";

const CollectionItem: React.FC<{
  uuid: string;
  name: string;
  icon: string;
}> = ({ uuid, name, icon }) => {
  return (
    <li className="text-zinc-50 pl-5 py-1 pr-1 hover:bg-zinc-700/75">
      <Link to={`/profile/${uuid}`} className="flex items-center gap-2">
        <Avatar className="rounded-none h-5 w-5">
          <AvatarImage className="rounded-none" src={icon} />
          <AvatarFallback className="rounded-none">
            <Book />
          </AvatarFallback>
        </Avatar>
        <span className="line-clamp-1">{name}</span>
      </Link>
    </li>
  );
};

export default CollectionItem;
