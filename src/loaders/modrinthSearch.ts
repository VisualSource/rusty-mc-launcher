import { getVersion } from "@tauri-apps/api/app";
import { ActionFunction } from "react-router-dom";

const modrinthSearch: ActionFunction = async ({ params, request }) => {
  const query = new URL(request.url).searchParams;
  const version = await getVersion();

  query.set("limit", "21");

  if (!query.has("offset")) {
    query.set("offset", "0");
  }

  if (!query.has("index")) {
    query.set("index", "relevance");
  }

  const response = await fetch(
    `https://api.modrinth.com/v2/search?${query.toString()}`,
    {
      headers: {
        "User-Agent": `VisualSource/rusty-mc-launcher/${version} collin_blosser@yahoo.com`,
      },
    },
  );

  if (!response.ok) {
    throw response;
  }

  return response.json();
};

export default modrinthSearch;
