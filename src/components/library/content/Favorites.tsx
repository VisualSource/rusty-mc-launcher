import { useSuspenseQuery } from "@tanstack/react-query";
import { Book } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FAVORITES_GUID } from "@/lib/models/categories";
import { Skeleton } from "@/components/ui/skeleton";
import { profile } from "@lib/models/profiles";
import PlayButton from "@/components/ui/play";
import { CATEGORY_KEY } from "@hook/keys";
import { db } from "@system/commands";

export const FavoritesLoading: React.FC = () => {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <Card className="relative w-80" key={i}>
          <CardHeader>
            <Skeleton className="h-4 w-1/3" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Skeleton className="h-36 w-full rounded-sm" />
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
      ))}
    </>
  );
};

const Favorites: React.FC = () => {
  const { data, error } = useSuspenseQuery({
    queryKey: [CATEGORY_KEY, FAVORITES_GUID],
    queryFn: () =>
      db.select<typeof profile.schema>({
        query:
          "SELECT profiles.* FROM profiles LEFT JOIN categories on profiles.id = categories.profile WHERE categories.category = ?",
        args: [FAVORITES_GUID],
        schema: profile.schema,
      }),
  });

  if (error) throw error;

  return (
    <>
      {data.length === 0 ? (
        <div className="flex h-full w-full items-center justify-center">
          No Favorites Yet!
        </div>
      ) : (
        data.map((value) => (
          <Card className="relative w-80" key={value.id}>
            <CardHeader>
              <CardTitle>{value.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Avatar className="aspect-square h-36 w-full rounded-none">
                <AvatarImage
                  src={value.icon ?? undefined}
                  className="rounded-none"
                />
                <AvatarFallback className="rounded-none">
                  <Book />
                </AvatarFallback>
              </Avatar>
              <PlayButton profile={value} />
            </CardContent>
          </Card>
        ))
      )}
    </>
  );
};

export default Favorites;
