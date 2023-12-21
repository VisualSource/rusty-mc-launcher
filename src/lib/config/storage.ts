import { getName } from "@tauri-apps/api/app";
import localforage from "localforage";

export const initStorage = async () => {
  try {
    const [name] = await Promise.all([getName()]);

    localforage.config({
      name,
      version: 1.0,
      description: "Internal Storage",
      storeName: "userdata",
    });
  } catch (error) {
    console.error(error);
  }
};
