import { useQuery } from "@tanstack/react-query";
//import { isGameRunning } from "@system/commands";

export const QUERY_KEY = "GAME_STATE" as const;

const useIsGameRunning = () => {
  const { data: state, isLoading } = useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      //const result = await isGameRunning();

      /*if (typeof result === "string") return result;

      if (result.Exited !== 0) {
        window.dispatchEvent(
          new CustomEvent("mcl::game-exit-status", {
            detail: { exitCode: result.Exited },
          }),
        );
      }*/

      return "NotRunning";
    },
    initialData: "NotRunning",
    refetchInterval: 2_000,
  });

  return {
    state,
    isLoading,
  };
};

export default useIsGameRunning;
