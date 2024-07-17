import { ErrorBoundary } from "react-error-boundary";
import { Suspense, memo } from "react";

import CollectionLarge, {
	CollectionLargeLoading,
} from "./core/CollectionLarge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ErrorFallback } from "../../content/ErrorFallback";
import { Separator } from "@/components/ui/separator";
import useCategories from "@/hooks/useCategories";

const CollectionDisplay = memo(
	({ params }: { params: Record<string, string> }) => {
		const cats = useCategories();

		const cat = cats.find((e) => e.metadata === params.id);

		return (
			<section className="mt-6 space-y-4">
				<h2 className="text-2xl font-semibold tracking-tight line-clamp-1">
					{cat?.value}
				</h2>
				<Separator className="my-4" />
				<div className="relative">
					<ScrollArea>
						<div className="flex space-x-4 pb-4">
							<ErrorBoundary fallbackRender={ErrorFallback}>
								<Suspense fallback={<CollectionLargeLoading />}>
									<CollectionLarge cat={params.id} />
								</Suspense>
							</ErrorBoundary>
						</div>
						<ScrollBar orientation="horizontal" />
					</ScrollArea>
				</div>
			</section>
		);
	},
);
CollectionDisplay.displayName = "CollectionDisplay";

export default CollectionDisplay;
