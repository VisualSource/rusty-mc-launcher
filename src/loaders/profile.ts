import profiles from "@/lib/models/profiles";
import type { LoaderFunction } from "react-router-dom";

const loadProfile: LoaderFunction = async ({ params }) => {
    if (!params.id) return new Response(null, { status: 404 });

    const data = await profiles.findOne({ where: [{ id: params.id }] });
    if (!data) return new Response(null, { status: 404 });

    return data;
}

export default loadProfile;