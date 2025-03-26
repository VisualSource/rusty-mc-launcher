import {
	createLazyFileRoute,
	ErrorComponent,
} from "@tanstack/react-router";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { RefreshCcw } from "lucide-react";
import { memo, Suspense } from "react";

import { SearchFilters } from "@/components/workshop/SearchFilters";
import { SearchContent } from "@/components/workshop/SearchContent";
import { SearchBar } from "@/components/workshop/SearchBar";
import { Loading } from "@/components/Loading";
import { Button } from "@/components/ui/button";

const Fallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
	return (
		<div role="alert" className="flex flex-col justify-center items-center h-full gap-4">
			<p>Something went wrong:</p>
			<Button size="sm" onClick={resetErrorBoundary}>
				<RefreshCcw className="h-5 w-5 mr-2" />
				Retry
			</Button>
			<pre className="bg-red-500 text-xs text-wrap text-center rounded-lg py-2 px-1.5">{(error as Error)?.message}</pre>
		</div>
	);
}

const WorkshopHome: React.FC = memo(() => {
	return (
		<div className="flex h-full overflow-hidden bg-accent/35">
			<aside className="w-60 overflow-y-scroll h-full pl-4 space-y-4 scrollbar pb-4">
				<ErrorBoundary FallbackComponent={Fallback}>
					<Suspense fallback={<Loading />}>
						<SearchFilters />
					</Suspense>
				</ErrorBoundary>
			</aside>
			<div className="w-full h-full flex flex-col">
				<SearchBar />
				<SearchContent />
			</div>
		</div>
	);
});
WorkshopHome.displayName = "WorkshopRoot";

export const Route = createLazyFileRoute("/_authenticated/workshop/search")({
	component: WorkshopHome,
	errorComponent: (error) => <ErrorComponent error={error} />,
	pendingComponent: Loading,
});
