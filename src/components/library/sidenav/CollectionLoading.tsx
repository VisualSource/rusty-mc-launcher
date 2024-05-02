import { Skeleton } from "@component/ui/skeleton";

const CollectionLoading: React.FC = () => {
  return (
    <li>
      <Skeleton className="h-7 w-full rounded-none" />
    </li>
  );
};

export default CollectionLoading;
