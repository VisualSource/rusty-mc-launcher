import { Await, useLoaderData } from "react-router-dom";
import { Suspense } from "react";

import ModrinthProject from "./ModrinthProject";
import { Spinner } from "../ui/spinner";

const WorkshopProject: React.FC = () => {
	const data = useLoaderData();

	return (
		<div className="flex h-full flex-col overflow-hidden">
			<Suspense
				fallback={
					<div className="flex w-full flex-col items-center justify-center">
						<Spinner />
					</div>
				}
			>
				<Await resolve={data}>
					<ModrinthProject />
				</Await>
			</Suspense>
		</div>
	);
};

export default WorkshopProject;
