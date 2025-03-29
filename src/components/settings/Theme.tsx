import { cn } from "@/lib/utils";
import { FormControl, FormItem, FormLabel } from "../ui/form";
import { RadioGroupItem } from "../ui/radio-group";

export const Theme: React.FC<{ currentValue: string, value: string, title: string; }> = ({ value, title, currentValue }) => {
    return (
        <FormItem>
            <FormLabel>
                <FormControl>
                    <RadioGroupItem value={value} className="sr-only" />
                </FormControl>
                <div className="flex flex-col cursor-pointer">
                    <div data-state={currentValue === value ? "checked" : "unchecked"} className="data-[state=checked]:border-primary items-center rounded-md border-2 border-muted bg-popover p-1 hover:bg-accent hover:text-accent-foreground">
                        <div data-theme={value} className="space-y-2 rounded-s bg-background p-2 dark">
                            <div className="space-y-2 rounded-md bg-accent p-2 shadow-xs">
                                <div className="h-2 w-[80px] rounded-lg bg-primary" />
                                <div className="h-2 w-[100px] rounded-lg bg-primary" />
                            </div>
                            <div className="flex items-center space-x-2 rounded-md bg-primary p-2 shadow-xs">
                                <div className="h-4 w-4 rounded-full bg-primary-foreground" />
                                <div className="h-2 w-[100px] rounded-lg bg-primary-foreground" />
                            </div>
                            <div className="flex items-center space-x-2 rounded-md bg-background p-2 shadow-xs">
                                <div className="h-4 w-4 rounded-full bg-accent" />
                                <div className="h-2 w-[100px] rounded-lg bg-accent" />
                            </div>
                        </div>
                    </div>
                    <span className={cn("block w-full p-2 text-center font-normal", currentValue === value && "underline")}>
                        {title}
                    </span>
                </div>
            </FormLabel>
        </FormItem>
    );
}