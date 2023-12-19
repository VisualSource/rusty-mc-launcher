import profiles from "@/lib/models/profiles";
import { json, type LoaderFunction } from "react-router-dom";

const librarydata: LoaderFunction = async ({ }) => {

    const result = await profiles.execute(`SELECT profile.* FROM profile LEFT JOIN categories on profile.id = categories.profile_id WHERE categories.profile_id NOT NULL AND categories.group_id = 1`);

    if (!result) {
        return json([], { status: 200 });
    }

    return json(result.map(value => profiles.parse(value)), { status: 200 });
}

export default librarydata;