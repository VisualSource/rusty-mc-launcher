import useCategories from "@/lib/hooks/useCategories";
import ListGroup from "./ListGroup";
import { Suspense } from "react";
import ListGroupLoading from "./ListGroupLoading";

const SidebarList = () => {
    const categories = useCategories();

    if (!categories.length) {
        return (
            <>
                <Suspense fallback={<ListGroupLoading />}>
                    <ListGroup id={1} name="Favorites" count={0} />
                </Suspense>
                <Suspense fallback={<ListGroupLoading />}>
                    <ListGroup id={0} name="Uncategorized" count={0} />
                </Suspense>
            </>
        )
    }

    return (
        <>
            {categories.map((value) => (
                <Suspense key={value.group_id} fallback={<ListGroupLoading />}>
                    <ListGroup key={value.group_id} id={value.group_id} name={value.name} count={value.count - 1} />
                </Suspense>
            ))}

        </>
    );
}

export default SidebarList;