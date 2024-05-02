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
      <div className="mr-2 flex flex-nowrap items-center gap-2 whitespace-nowrap">
        <TypographyH4 className="text-lg">{label}</TypographyH4>
        <TypographyMuted asChild>
          <span>({count})</span>
        </TypographyMuted>
      </div>
      <Separator className="h-[2px] shrink dark:bg-zinc-500" />
      <div className="ml-2 flex flex-grow whitespace-nowrap">{children}</div>
    </div>
  );
};

export default SectionDivider;
