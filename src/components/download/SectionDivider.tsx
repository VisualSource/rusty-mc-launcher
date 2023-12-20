import { TypographyH4, TypographyMuted } from "../ui/typography";
import { Separator } from "../ui/separator";

type Props = {
  count: number;
  label: string;
};

const SectionDivider: React.FC<React.PropsWithChildren<Props>> = ({
  children,
  count,
  label,
}) => {
  return (
    <div className="flex w-full items-center">
      <div className="flex items-center gap-2 flex-nowrap whitespace-nowrap mr-2">
        <TypographyH4 className="text-lg">{label}</TypographyH4>
        <TypographyMuted asChild>
          <span>({count})</span>
        </TypographyMuted>
      </div>
      <Separator className="dark:bg-zinc-500 h-[2px] shrink" />
      <div className="flex flex-grow whitespace-nowrap ml-2">{children}</div>
    </div>
  );
};

export default SectionDivider;
