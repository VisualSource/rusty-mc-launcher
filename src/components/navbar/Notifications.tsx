import { useNotificationCenter } from "react-toastify/addons/use-notification-center";
import { Archive, Mail } from "lucide-react";
import { formatRelative } from "date-fns/formatRelative";
import { TypographyH4, TypographyMuted } from "../ui/typography";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { ScrollArea } from "../ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@component/ui/popover";
import { cn } from "@/lib/utils";

/*<Button variant="secondary" size="sm">
                        View All
    </Button>*/
export const Notifications = () => {
  const { notifications, markAllAsRead, remove, clear } =
    useNotificationCenter();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "mr-2 flex items-center px-2.5 text-white transition-colors",
            {
              "bg-green-500": notifications.length > 0,
              "bg-zinc-800": notifications.length === 0,
            },
          )}
        >
          {notifications.length > 0 ? (
            <span className="mr-2 text-sm">{notifications.length}</span>
          ) : null}
          <Mail className="h-5 w-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={4} className="w-80">
        <div className="flex justify-between">
          <TypographyH4>Notifications</TypographyH4>
        </div>
        <Separator className="mb-4 mt-2" />
        <ScrollArea className="max-h-56 pt-4">
          <ul className="min-h-[200px] space-y-2">
            {notifications.map((value) => (
              <li
                key={value.id}
                className="flex items-center justify-between rounded-md bg-zinc-700 px-4 py-1"
              >
                {(value.icon as React.ReactNode) ?? null}
                <div>
                  <div className="line-clamp-1 flex flex-col font-medium">
                    {value.content as React.ReactNode}
                    <span className="text-xs">
                      {(value.data as { error?: string })?.error ?? ""}
                    </span>
                  </div>
                  <TypographyMuted asChild>
                    <span>
                      {formatRelative(new Date(value.createdAt), new Date())}
                    </span>
                  </TypographyMuted>
                </div>
                <Button
                  title="Archive notification"
                  onClick={() => remove(value.id)}
                  size="icon"
                  variant="destructive"
                >
                  <Archive />
                </Button>
              </li>
            ))}
          </ul>
        </ScrollArea>
        <Separator className="mb-4" />
        <div className="flex justify-between">
          <Button size="sm" onClick={() => clear()}>
            Clear All
          </Button>
          <Button size="sm" onClick={() => markAllAsRead()}>
            Mark All Read
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
