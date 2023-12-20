import { useQuery } from "@tanstack/react-query";
import { isGameRunning } from "../system/commands";

const useIsGameRunning = () => {
  const { data: state, isLoading } = useQuery({
    queryKey: ["GAME_STATE"],
    queryFn: async () => isGameRunning(),
    initialData: false,
    refetchInterval: 2_000,
  });

  return {
    state,
    isLoading,
  };
};

export default useIsGameRunning;
