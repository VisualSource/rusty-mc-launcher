import type { ControllerRenderProps, UseFormReturn } from "react-hook-form";
import type { MinecraftProfile } from "@/lib/models/profiles";
import { MarkedSlider } from "@/components/ui/slider"
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "./ui/select";
import { cn } from "@/lib/utils";
import { range } from "@/lib/range";
import { useMemo, useRef, useState } from "react";
import JVMArgs from "@/lib/JvmArgs";
import { getSystemRaw } from "@/lib/system/commands";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";

const TickedSilder: React.FC<{ min: number, max: number, disabled?: boolean }> = ({ min, max, disabled }) => {
    const tickRange = useMemo(() => range(min, max, 1), [min, max]);
    return (
        <div className="flex-grow items-center">
            <MarkedSlider disabled={disabled} defaultValue={[2]} min={min} max={max} step={1} />
            <div className='mt-1.5 flex flex-row justify-between items-center relative'>
                {tickRange.map((_, i) => (
                    <span
                        key={`maxMemory-${i + 2}`}

                        className={cn('text-sm font-light text-center', { 'text-10 opacity-40 h-5 w-5 select-none touch-none': i >= 0 && i < max })}
                        role='presentation'
                    >
                        {i % 4 === 0 ? i + min : '|'}
                    </span>
                )
                )}
            </div>
        </div>
    );
}

export const JVMArgForm: React.FC<{
    controller: ControllerRenderProps<MinecraftProfile>

}> = ({ controller }) => {
    const [showDialog, setShowDialog] = useState(false);
    const [argValue, setArgValue] = useState("");
    const { data: ram } = useSuspenseQuery({ queryKey: ["SYSTEM_RAW"], queryFn: () => getSystemRaw() })
    const state = useRef(new JVMArgs(controller?.value ?? ""));

    return (
        <div className="space-y-4">
            <Separator />
            <div className="flex gap-4 items-center mb-8">
                <Label>Max Memory</Label>
                <TickedSilder min={2} max={ram - 5} />
            </div>

            <div className="space-y-4 mt-4">
                <div className="flex justify-between items-center">
                    <Label>Other Jvm Args</Label>
                    <Dialog onOpenChange={setShowDialog} open={showDialog}>
                        <DialogTrigger asChild>
                            <Button type="button" size="sm"> <Plus className="h-4 w-4" /> Add</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Arg</DialogTitle>
                            </DialogHeader>
                            <Label>Arg</Label>
                            <Input value={argValue} onChange={(e) => setArgValue(e.target.value)} placeholder="-XX:+UseG1GC" />
                            <DialogFooter>
                                <Button type="button" onClick={() => {
                                    setArgs((e) => [...e, argValue]);
                                    setArgValue("");
                                }}>Ok</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="flex flex-wrap gap-2">
                    {args.map((e, i) => (
                        <Badge className="select-none cursor-not-allowed" key={`${i + 1}`}>{e}</Badge>
                    ))}
                </div>
            </div>

        </div>
    );
}