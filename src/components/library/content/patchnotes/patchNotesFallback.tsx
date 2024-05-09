import { Card, CardContent, CardHeader } from "@component/ui/card";
import { Skeleton } from "@component/ui/skeleton";

export const PatchNotesLoading: React.FC = () => {
  return (
    <div className="flex w-max flex-nowrap space-x-4 p-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card className="relative w-80" key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Skeleton className="h-56" />
            <Skeleton className="h-9" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
