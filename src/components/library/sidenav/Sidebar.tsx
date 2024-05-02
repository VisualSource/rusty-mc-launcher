import { ErrorBoundary } from "react-error-boundary";
import { AlertTriangle } from "lucide-react";
import { Suspense } from "react";

import CollectionLoading from "./CollectionLoading";
import useCategories from "@hook/useCategories";
import Collection from "./Collection";

const Sidebar = () => {
  const collections = useCategories();

  if (!collections.length) {
    return (
      <>
        <Suspense fallback={<CollectionLoading />}>
          <Collection id={1} name="Favorites" count={0} />
        </Suspense>
        <Suspense fallback={<CollectionLoading />}>
          <Collection id={0} name="Uncategorized" count={0} />
        </Suspense>
      </>
    );
  }

  return (
    <>
      {collections.map((value) => (
        <ErrorBoundary
          key={value.group_id}
          fallback={
            <li>
              <div className="flex w-full items-center  bg-gradient-to-r from-zinc-700/95 from-10% to-zinc-800 px-1 py-0.5 text-zinc-50">
                <AlertTriangle className="mr-1 h-5 w-5" />
                <div className="line-clamp-1 text-sm font-medium uppercase">
                  Error loading "{value.name}"
                </div>
              </div>
            </li>
          }
        >
          <Suspense fallback={<CollectionLoading />}>
            <Collection
              id={value.group_id}
              name={value.name ?? ""}
              count={(value as { count: number }).count - 1}
            />
          </Suspense>
        </ErrorBoundary>
      ))}
    </>
  );
};

export default Sidebar;
