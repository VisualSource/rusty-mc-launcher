import { useCallback, useContext, useEffect, useSyncExternalStore } from "react";
import { CRASH_EVENT, type ProcessCrashEvent } from "@system/processesWatcher";
import { processContext } from "@/lib/context/ProcessContext";

export const useProcessState = () => {
    const state = useContext(processContext);
    if (!state) throw new Error("useProcessState requires to be within a ProcessPrivider");
    return state;
}

export const useCrashEvent = (onCrash: (ev: CustomEvent<ProcessCrashEvent>) => void) => {
    const state = useProcessState();
    const callback = useCallback(onCrash, []);
    useEffect(() => {
        state.addEventListener(CRASH_EVENT, callback as never);
        return () => {
            state.removeEventListener(CRASH_EVENT, callback as never);
        }
    }, [callback, state]);
}

export const useIsRunning = (profile: string) => {
    const state = useProcessState();
    const snapshot = useCallback(() => state.isProfileRunning(profile), [profile, state]);
    return useSyncExternalStore(state.onSync, snapshot);
}