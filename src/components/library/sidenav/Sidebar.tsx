import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { ErrorBoundary } from "react-error-boundary";
import { memo, Suspense } from "react";

import { FAVORITES_GUID, UNCATEGORIZEDP_GUID } from "@/lib/models/categories";
import { CollectionLoading, CollectionError } from "./CollectionStatus";
import { TypographyH4 } from "@/components/ui/typography";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import useCategories from "@hook/useCategories";
import Collection from "./Collection";
import { ScrollArea } from "@/components/ui/scroll-area";

const EMPTY_DATA = [
	{ id: FAVORITES_GUID, name: "Favorites" },
	{ id: UNCATEGORIZEDP_GUID, name: "Uncategorized" },
];

const loadSaved = () => {
	const values = localStorage.getItem("categories-open");
	if (!values) return;

	return values.split(",").map(e => atob(e))
}

const saveValues = (values: string[]) => {
	const data = values.map(e => btoa(e)).join(",");

	localStorage.setItem("categories-open", data);
}

export const SidebarError: React.FC<{
	error: Error;
	resetErrorBoundary: () => void;
}> = ({ error, resetErrorBoundary }) => {
	return (
		<div
			role="alert"
			className="flex h-full flex-col items-center justify-center space-y-6"
		>
			<div className="flex flex-col items-center justify-center">
				<AlertTriangle />
				<TypographyH4 className="text-base">Something went wrong:</TypographyH4>
				<pre className="text-sm text-red-400">{error.message}</pre>
			</div>
			<Button onClick={() => resetErrorBoundary()} variant="secondary">
				<RefreshCcw className="mr-2 h-5 w-5" />
				Retry
			</Button>
		</div>
	);
};

const Sidebar = memo(() => {
	const collections = useCategories();

	const defaultValues = loadSaved();

	return (
		<ScrollArea>
			<Accordion type="multiple" defaultValue={defaultValues} onValueChange={saveValues} >
				{collections.length
					? collections.map((category) => (
						<QueryErrorResetBoundary key={category.metadata}>
							{({ reset }) => (
								<ErrorBoundary
									onReset={reset}
									fallback={<CollectionError name={category?.value ?? ""} />}
								>
									<Suspense fallback={<CollectionLoading />}>
										<Collection
											name={category.value ?? "Unknown Name"}
											id={category.metadata}
										/>
									</Suspense>
								</ErrorBoundary>
							)}
						</QueryErrorResetBoundary>
					))
					: EMPTY_DATA.map((item) => (
						<QueryErrorResetBoundary key={`${item.name}_${item.id}`}>
							{({ reset }) => (
								<ErrorBoundary
									onReset={reset}
									fallback={<CollectionError name={item.name} />}
								>
									<Suspense fallback={<CollectionLoading />}>
										<Collection id={item.name} name={item.name} />
									</Suspense>
								</ErrorBoundary>
							)}
						</QueryErrorResetBoundary>
					))}
			</Accordion>
		</ScrollArea>
	);
});

export default Sidebar;
