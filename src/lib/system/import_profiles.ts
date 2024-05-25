import { BaseDirectory, readTextFile } from "@tauri-apps/api/fs";
//import { parseISO } from "date-fns/parseISO";
import { open } from "@tauri-apps/api/dialog";
import { toast } from "react-toastify";
import logger from "./logger";

const import_profiles = async () => {
  const dir = "";
  const result = await open({
    multiple: false,
    defaultPath: dir,
    title: "Import Profiles",
    filters: [
      {
        name: "Json",
        extensions: ["json"],
      },
    ],
  });

  if (!result || Array.isArray(result)) {
    toast.error("Failed to import profiles");
    return;
  }

  try {
    const content = await readTextFile(result, { dir: BaseDirectory.AppData });

  } catch (error) {
    logger.error(error);
    toast.error("Import profile error!");
  }

  toast.success("Imported Profiles");
};

export default import_profiles;
