import { createContext } from "react";
import type { ProcessState } from "../system/processesWatcher";

export const processContext = createContext<ProcessState | null>(null);
