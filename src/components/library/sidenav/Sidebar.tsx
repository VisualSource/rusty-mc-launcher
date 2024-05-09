import { ErrorBoundary } from "react-error-boundary";
import { QueryErrorResetBoundary } from '@tanstack/react-query'
import { Suspense } from "react";

import { CollectionLoading, CollectionError } from "./CollectionStatus";
import { Accordion } from "@/components/ui/accordion"
import useCategories from "@hook/useCategories";
import Collection from "./Collection";
import { TypographyH4, } from "@/components/ui/typography";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

const EMPTY_DATA = [{ id: 0, name: "Favorites", count: 0 }, { id: 1, name: "Uncategorized", count: 0 }];

export const SidebarError: React.FC<{ error: Error, resetErrorBoundary: () => void }> = ({ error, resetErrorBoundary }) => {
  return (
    <div role="alert" className="flex h-full flex-col justify-center items-center space-y-6">
      <div className="flex flex-col justify-center items-center">
        <AlertTriangle />
        <TypographyH4 className="text-base">Something went wrong:</TypographyH4>
        <pre className="text-sm text-red-400">{error.message}</pre>
      </div>
      <Button onClick={() => resetErrorBoundary()} variant="secondary"><RefreshCcw className="h-5 w-5 mr-2" />Retry</Button>
    </div>
  );
}


const Sidebar = () => {
  const collections = useCategories();

  return (
    <Accordion type="multiple">
      {collections.length ? collections.map(category => (
        <QueryErrorResetBoundary key={category.group_id}>
          {({ reset }) => (
            <ErrorBoundary onReset={reset} fallback={<CollectionError name={category?.name ?? ""} />}>
              <Suspense fallback={<CollectionLoading />}>
                <Collection name={category.name ?? "Unknown Name"} count={(category as { count: number }).count - 1} id={category.group_id} />
              </Suspense>
            </ErrorBoundary>
          )}
        </QueryErrorResetBoundary>
      )) : (
        EMPTY_DATA.map((item) => (
          <QueryErrorResetBoundary key={`${item.name}_${item.id}`}>
            {({ reset }) => (
              <ErrorBoundary onReset={reset} fallback={<CollectionError name={item.name} />}>
                <Suspense fallback={<CollectionLoading />}>
                  <Collection id={item.id} name={item.name} count={item.count} />
                </Suspense>
              </ErrorBoundary>
            )}
          </QueryErrorResetBoundary>
        ))
      )}
    </Accordion>
  );
};

export default Sidebar;
