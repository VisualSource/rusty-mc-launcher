import { useState } from "react"
import { FormDescription, FormItem, FormLabel } from "../ui/form"
import { Switch } from "../ui/switch"

export const LightDarkControl: React.FC = () => {
    const [darkMode, setDarkMode] = useState(document.querySelector("html")?.classList.contains("dark"))

    return (
        <FormItem className="flex justify-between">
            <div>
                <FormLabel>Dark Mode</FormLabel>
                <FormDescription>
                    Use dark mode
                </FormDescription>
            </div>
            <Switch checked={darkMode} onCheckedChange={(value) => {
                const target = document.querySelector("html");
                if (!target) return;
                target.classList.toggle("dark");

                if (value) {
                    localStorage.removeItem("useLight");
                } else {
                    localStorage.setItem("useLight", "1");
                }

                setDarkMode(value);
            }} />
        </FormItem>
    )
}