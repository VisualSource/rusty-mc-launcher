import { processContext, ProcessState } from "./ProcessContext";
import GameCrash from "@/components/dialog/GameCrash";

const client = new ProcessState();

export const ProcessProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    return (
        <processContext.Provider value={client}>
            <GameCrash />
            {children}
        </processContext.Provider>
    );
}