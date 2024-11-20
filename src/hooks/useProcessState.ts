import { useCallback, useContext, useSyncExternalStore } from "react";
import { processContext } from "@/lib/context/ProcessContext";

export const useProcessState = () => {
    const state = useContext(processContext);
    if (!state) throw new Error("useProcessState requires to be within a ProcessPrivider");
    return state;
}
export const useIsRunning = (profile: string) => {
    const state = useProcessState();
    const snapshot = useCallback(() => {
        return state.getState(profile)
    }, [profile, state]);
    return useSyncExternalStore(state.onEvent, snapshot);
}