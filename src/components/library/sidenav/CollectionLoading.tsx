import { Skeleton } from "@component/ui/skeleton";

const CollectionLoading: React.FC = () => {
  return (
    <li>
      <Skeleton className="w-full h-7" />
    </li>
  );
};

export default CollectionLoading;
