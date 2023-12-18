import { useAsyncError, useRouteError } from "react-router-dom"
import { TypographyH2, TypographyInlineCode } from "../ui/typography";

const ModrinthBoundaryError: React.FC = () => {
    const error = useRouteError() as Error;

    return (
        <div className="flex flex-col justify-center items-center h-full text-zinc-50">
            <TypographyH2>Error</TypographyH2>
            <TypographyInlineCode className="text-zinc-50">{error.message}</TypographyInlineCode>
        </div>
    );
}

export default ModrinthBoundaryError;