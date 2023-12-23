import { Suspense } from "react";

import CollectionLoading from "./CollectionLoading";
import useCategories from "@hook/useCategories";
import Collection from "./Collection";
import { ErrorBoundary } from "react-error-boundary";
import { AlertTriangle } from "lucide-react";

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
              <div className="flex py-0.5 px-1  text-zinc-50 items-center bg-gradient-to-r from-zinc-700/95 from-10% to-zinc-800 w-full">
                <AlertTriangle className="h-5 w-5 mr-1" />
                <div className="text-sm line-clamp-1 uppercase font-medium">
                  Error loading "{value.name}"
                </div>
              </div>
            </li>
          }
        >
          <Suspense fallback={<CollectionLoading />}>
            <Collection
              id={value.group_id}
              name={value.name}
              count={value.count - 1}
            />
          </Suspense>
        </ErrorBoundary>
      ))}
    </>
  );
};

export default Sidebar;
