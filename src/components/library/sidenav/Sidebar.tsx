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
        <Suspense key={value.group_id} fallback={<CollectionLoading />}>
          <Collection
            key={value.group_id}
            id={value.group_id}
            name={value.name}
            count={value.count - 1}
          />
        </Suspense>
      ))}
    </>
  );
};

export default Sidebar;
