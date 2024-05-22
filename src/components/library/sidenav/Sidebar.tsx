import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";

import { CollectionLoading, CollectionError } from "./CollectionStatus";
import { TypographyH4, } from "@/components/ui/typography";
import { Accordion } from "@/components/ui/accordion"
import useCategories from "@hook/useCategories";
import Collection from "./Collection";


import { Button } from "@/components/ui/button";

const EMPTY_DATA = [{ id: "aa0470a6-89e9-4404-a71c-008ee2025e72", name: "Favorites", }, { id: "40b8bf8c-5768-4c0d-82ba-8c00bb181cd8", name: "Uncategorized" }];

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
        <QueryErrorResetBoundary key={category.metadata}>
          {({ reset }) => (
            <ErrorBoundary onReset={reset} fallback={<CollectionError name={category?.value ?? ""} />}>
              <Suspense fallback={<CollectionLoading />}>
                <Collection name={category.value ?? "Unknown Name"} id={category.metadata!} />
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
                  <Collection id={item.name} name={item.name} />
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
