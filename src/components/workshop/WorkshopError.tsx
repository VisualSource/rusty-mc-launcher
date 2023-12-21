import { useRouteError } from "react-router-dom";
import { TypographyH2, TypographyInlineCode } from "@component/ui/typography";

const WorkshopError: React.FC = () => {
  const error = useRouteError() as Error;

  return (
    <div className="flex flex-col justify-center items-center h-full text-zinc-50">
      <TypographyH2>Error</TypographyH2>
      <TypographyInlineCode className="text-zinc-50">
        {error?.message ?? "Unknown error."}
      </TypographyInlineCode>
    </div>
  );
};

export default WorkshopError;
