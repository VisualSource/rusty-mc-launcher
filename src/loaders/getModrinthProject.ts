import type { LoaderFunction } from "react-router-dom";
import { ProjectsService } from "@lib/api/modrinth/services.gen";

const getModrinthProject: LoaderFunction = async ({ params }) => {
  if (!params.uuid) throw new Response("Bad Request", { status: 400 });

  return ProjectsService.getProject({ idSlug: params.uuid });
};

export default getModrinthProject;
