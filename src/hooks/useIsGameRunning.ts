import { useQuery } from "@tanstack/react-query";
import { isRunning } from "@system/commands";

export const QUERY_KEY = "GAME_STATE" as const;

const useIsGameRunning = ({ profile }: { profile: string }) => {
  const { data: state, isLoading } = useQuery({
    queryKey: [QUERY_KEY, profile],
    queryFn: async () => {
      return isRunning(profile);
    },
    initialData: false,
    refetchInterval: 2_000,
  });

  return {
    state,
    isLoading,
  };
};

export default useIsGameRunning;
