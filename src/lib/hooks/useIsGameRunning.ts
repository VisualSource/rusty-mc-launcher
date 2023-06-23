import { useQuery } from "@tanstack/react-query"
import { isGameRunning } from "../system/commands"

const useIsGameRunning = () => {
    const { data: state, isLoading, isError } = useQuery(["game_state"], async () => {
        return isGameRunning();
    }, { refetchInterval: 2_000 });

    return {
        state,
        isError,
        isLoading
    };
}

export default useIsGameRunning;