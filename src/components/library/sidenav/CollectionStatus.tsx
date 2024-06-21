import { useErrorBoundary } from "react-error-boundary";
import { AlertTriangle } from "lucide-react";
import { Skeleton } from "@component/ui/skeleton";

export const CollectionLoading: React.FC = () => {
  return <Skeleton className="h-7 w-full rounded-none" />;
};

export const CollectionError: React.FC<{ name: string }> = ({ name }) => {
  const { resetBoundary } = useErrorBoundary();
  return (
    <div className="flex w-full items-center bg-gradient-to-r from-zinc-700/95 from-10% to-zinc-800 px-1 py-0.5 text-zinc-50">
      <AlertTriangle onClick={() => resetBoundary()} className="mr-1 h-5 w-5" />
      <div className="line-clamp-1 text-xs font-medium uppercase">
        Error loading "{name}"
      </div>
    </div>
  );
};
