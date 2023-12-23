import type { ActionFunction } from "react-router-dom";
import profiles, { type MinecraftProfile } from "@/lib/models/profiles";

const updateProfile: ActionFunction = async ({ request }) => {
  const data = (await request.json()) as MinecraftProfile;

  switch (request.method.toUpperCase()) {
    case "POST":
      await profiles.create({ data });
      break;
    case "PATCH":
      await profiles.update({ data, where: [{ id: data.id }] });
      break;
    default:
      break;
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: `/profile/${data.id}`,
    },
  });
};

export default updateProfile;
