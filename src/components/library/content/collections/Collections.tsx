import { Suspense } from "react";
import CollectionsLoading from "./CollectionsLoading";
import CollectionsRoot from "./CollectionsRoot";

const Collections: React.FC = () => {
	return (
		<Suspense fallback={<CollectionsLoading />}>
			<CollectionsRoot />
		</Suspense>
	);
};

export default Collections;
