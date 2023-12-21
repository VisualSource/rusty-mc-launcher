import { Await, useLoaderData } from "react-router-dom";
import { Suspense } from "react";

import ModrinthProject from "./ModrinthProject";
import { Spinner } from "../ui/spinner";

const WorkshopProject: React.FC = () => {
  const data = useLoaderData();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Suspense
        fallback={
          <div className="w-full flex flex-col justify-center items-center">
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
