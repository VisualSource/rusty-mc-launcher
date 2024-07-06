import { createLazyFileRoute } from "@tanstack/react-router";
import { Suspense, useState, lazy } from "react";

import { DisplayContainer } from "@/components/library/content/DisplayContainer";
import { Loading } from "@/components/Loading";

export const Route = createLazyFileRoute("/_authenticated/_layout/")({
	component: Index,
	pendingComponent: Loading,
});

const EditContainer = lazy(() => import("@/components/library/content/EditContainerLazy"));

function Index() {
	const [editMode, setEditMode] = useState(false);

	return (
		<div className="ml-4 overflow-y-scroll overflow-x-hidden scrollbar pr-2">
			{editMode ? (
				<Suspense>
					<EditContainer setEditMode={setEditMode} />
				</Suspense>
			) : (
				<DisplayContainer setEditMode={setEditMode} />
			)}
		</div>
	);
}