import { TypographyMuted } from "./ui/typography";
import { formatRelative } from "date-fns";

const NotificationTime: React.FC<{ createdAt: number }> = ({ createdAt }) => {
  return (
    <TypographyMuted asChild>
      <span>{formatRelative(new Date(createdAt), new Date())}</span>
    </TypographyMuted>
  );
};

export default NotificationTime;
