import { useState, useReducer, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FabricLoaderVersionSelector } from "@/components/ui/FabricLoaderSelector";

import { VersionSelector } from "@/components/ui/VersionSelector";
import { Checkbox } from "@/components/ui/checkbox";
import { parseLastVersionId } from "@/lib/parseLastVersionId";
import { Label } from "@/components/ui/label";
import { buildLastVersionId } from "@/lib/buildLastVerseionId";

const reducer = (state: ReturnType<typeof parseLastVersionId>, action: { type: string, value: string }) => {
    switch (action.type) {
        case "loader":
            return { ...state, loader: action.value }
        case "loader_version":
            return { ...state, loader_version: action.value === "" ? null : action.value }
        case "game_version":
            return { ...state, game_version: action.value }
        default:
            return state;
    }
}

export const ProfileVersionSelector: React.FC<{ lastVersionId: string, onChange?: (value: string) => void }> = ({ onChange, lastVersionId }) => {
    const [state, dispatch] = useReducer(reducer, parseLastVersionId(lastVersionId));
    const [showSnapshots, setShowSnapshots] = useState(false);

    useEffect(() => {
        try {
            const value = buildLastVersionId(state);
            if (lastVersionId !== value) onChange?.call(undefined, value);
        } catch (error) { }
    }, [onChange, state]);

    return (
        <div className="flex flex-col space-y-2">
            <VersionSelector defaultValue={state.game_version} type={showSnapshots ? "both" : "release"} />
            <div className="flex gap-2 items-center">
                <Checkbox checked={showSnapshots} onCheckedChange={(e) => setShowSnapshots(e as boolean)} />
                <Label>Show Snapshots</Label>
            </div>

            <Select value={state.loader} onValueChange={(e) => dispatch({ type: "loader", value: e })}>
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="vanilla">Vanilla</SelectItem>
                    <SelectItem value="fabric">Fabric</SelectItem>
                    <SelectItem value="forge">Forge</SelectItem>
                    <SelectItem value="newforge">NeoForge</SelectItem>
                </SelectContent>
            </Select>

            {state.loader !== "vanilla" ? (
                <FabricLoaderVersionSelector defaultValue={state.loader_version ?? ""} onChange={(e) => dispatch({ type: "loader_version", value: e })} />
            ) : null}
        </div>
    );
}