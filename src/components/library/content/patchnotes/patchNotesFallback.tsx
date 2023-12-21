import { AlertTriangle } from "lucide-react";

import { Card, CardContent, CardHeader } from "@component/ui/card";
import { TypographyH3 } from "@component/ui/typography";
import { Skeleton } from "@component/ui/skeleton";
import PatchNotesRoot from "./PatchNotesRoot";

export const PatchNotesLoading: React.FC = () => {
  return (
    <PatchNotesRoot>
      <div className="flex w-max space-x-4 p-4 flex-nowrap">
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
    </PatchNotesRoot>
  );
};

export const PatchNotesError: React.FC = () => {
  return (
    <PatchNotesRoot>
      <div className="flex p-4 justify-center">
        <div className="flex flex-col justify-center items-center">
          <AlertTriangle className="w-24 h-24" />
          <TypographyH3>Failed to load Patch Notes</TypographyH3>
        </div>
      </div>
    </PatchNotesRoot>
  );
};
