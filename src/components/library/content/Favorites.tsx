import { useSuspenseQuery } from "@tanstack/react-query";
import { Book } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CATEGORY_KEY, CATEGORIES_ENUM } from "@hook/keys";
import { Skeleton } from "@/components/ui/skeleton";
import { profile } from "@lib/models/profiles";
import PlayButton from "@/components/ui/play";
import DB from "@lib/api/db";

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
    queryKey: [CATEGORY_KEY, CATEGORIES_ENUM.Favorites],
    queryFn: async () => {
      const db = DB.use();
      const result = await db.select<unknown[]>(`SELECT profile.* FROM profile LEFT JOIN categories on profile.id = categories.profile_id WHERE categories.profile_id NOT NULL AND categories.group_id = ?`, [CATEGORIES_ENUM.Favorites]);
      return result.map(item => profile.schema.parse(item));
    },
  });

  if (error) throw error;

  return (
    <>
      {data.map((value) => (
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
      ))}
    </>
  );
};

export default Favorites;
