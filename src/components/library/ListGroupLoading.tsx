import { Skeleton } from "../ui/skeleton";

const ListGroupLoading: React.FC = () => {
  return (
    <li>
      <Skeleton className="w-full h-7" />
    </li>
  );
};

export default ListGroupLoading;
