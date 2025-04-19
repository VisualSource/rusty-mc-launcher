import { loadThemes } from "@/lib/api/themes"
import { useSuspenseQuery } from "@tanstack/react-query"
import { Theme } from "./Theme";

export const ExternalThemes: React.FC<{ current: string }> = ({ current }) => {
    const { data, error } = useSuspenseQuery({
        queryKey: ["external-themes"],
        queryFn: async () => {
            const { themes, errors } = await loadThemes();

            return {
                themes: Array.from(themes.values()),
                errors,
            }
        }
    });
    if (error) throw error;

    return (
        <div className="flex flex-wrap gap-2">
            {data.themes.map((theme) => (
                <Theme
                    key={theme.id}
                    currentValue={current}
                    value={theme.id}
                    title={theme.name}
                />
            ))}
        </div>
    );
}