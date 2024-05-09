import { AlertTriangle, RefreshCcw } from "lucide-react";
import { TypographyH3 } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";

export const ErrorFallback: React.FC<{ error: Error, resetErrorBoundary: () => void }> = ({ error, resetErrorBoundary }) => {

    return (
        <div className="flex h-56 flex-col items-center justify-center w-full space-y-6" role="alert">
            <div className="flex flex-col justify-center items-center">
                <AlertTriangle />
                <TypographyH3>Something went wrong:</TypographyH3>
                <pre className="text-red-300">{error.message}</pre>
            </div>

            <Button onClick={() => resetErrorBoundary()} variant="secondary"><RefreshCcw className="h-5 w-5 mr-2" />Retry</Button>
        </div>
    );
};