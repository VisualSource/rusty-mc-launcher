import { useSuspenseQuery } from "@tanstack/react-query";
import { AlertTriangle, Book } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import profiles, { type MinecraftProfile } from "@/lib/models/profiles";
import { TypographyH3 } from "@/components/ui/typography";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORY_KEY } from "@/lib/hooks/keys";
import PlayButton from "@/components/ui/play";

export const FavoritesErrored: React.FC = () => {
  return (
    <div className="flex w-full flex-col items-center justify-center">
      <AlertTriangle />
      <TypographyH3>Failed to load Favorites</TypographyH3>
    </div>
  );
};

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
    queryKey: [CATEGORY_KEY, 1],
    queryFn: async () => {
      const result = await profiles.execute<MinecraftProfile>(
        `SELECT profile.* FROM profile LEFT JOIN categories on profile.id = categories.profile_id WHERE categories.profile_id NOT NULL AND categories.group_id = 1`,
        [],
        true,
      );
      return result ?? [];
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
