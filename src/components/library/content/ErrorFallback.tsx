import { AlertTriangle, RefreshCcw } from "lucide-react";
import { TypographyH3 } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";

export const ErrorFallback: React.FC<{
	error: Error;
	resetErrorBoundary: () => void;
}> = ({ error, resetErrorBoundary }) => {
	return (
		<div
			className="flex h-56 w-full flex-col items-center justify-center space-y-6"
			role="alert"
		>
			<div className="flex flex-col items-center justify-center">
				<AlertTriangle />
				<TypographyH3>Something went wrong:</TypographyH3>
				<pre className="text-red-300">{error.message}</pre>
			</div>

			<Button onClick={() => resetErrorBoundary()} variant="secondary">
				<RefreshCcw className="mr-2 h-5 w-5" />
				Retry
			</Button>
		</div>
	);
};
