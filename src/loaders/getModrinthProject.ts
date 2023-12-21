import type { LoaderFunction } from "react-router-dom";
import { getVersion } from "@tauri-apps/api/app";

const getModrinthProject: LoaderFunction = async ({ params }) => {
  if (!params.uuid) throw new Response("Bad Request", { status: 400 });
  const app_version = await getVersion();

  const response = await fetch(
    `https://api.modrinth.com/v2/project/${params.uuid}`,
    {
      headers: {
        "User-Agent": `VisualSource/rusty-mc-launcher/${app_version} collin_blosser@yahoo.com`,
      },
    },
  );

  return response.json();
};

export default getModrinthProject;
