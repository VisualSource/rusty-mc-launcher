import { TypographyH3 } from "@component/ui/typography";
import { Separator } from "@component/ui/separator";

const PatchNotesRoot: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <section className="flex flex-col">
      <div className="pt-4 flex items-center gap-4 pb-2 whitespace-nowrap">
        <TypographyH3>Patch Notes</TypographyH3>
        <Separator className="dark:bg-zinc-50" />
      </div>
      {children}
    </section>
  );
};

export default PatchNotesRoot;
