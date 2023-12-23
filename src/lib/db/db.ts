import logger from "../system/logger";
import {
  writeBinaryFile,
  createDir,
  exists,
  BaseDirectory,
} from "@tauri-apps/api/fs";
import { appDataDir, resolve } from "@tauri-apps/api/path";
import SQLite from "tauri-plugin-sqlite-api";

const DATABASE_FILE = "database.db";

export default class DB {
  static INSTANCE: DB | null = null;
  static use(): SQLite {
    if (!DB.INSTANCE) {
      throw new Error("No database instance avaliable");
    }
    return DB.INSTANCE._connection!;
  }
  static init() {
    return new Promise<void>((ok, reject) => {
      try {
        const inst = new DB();
        inst.init().then(() => ok());
      } catch (error) {
        reject(error);
      }
    });
  }

  private _connection: SQLite | undefined;

  constructor() {}

  private async init() {
    const dir = await appDataDir();
    const file = await resolve(dir, DATABASE_FILE);

    logger.debug(`database file path: ${file}`);

    const fileExist = await exists(DATABASE_FILE, {
      dir: BaseDirectory.AppData,
    });

    logger.debug(
      `Checking for database file. Exists: ${fileExist ? "yes" : "no"}`,
    );
    if (!fileExist) {
      await createDir(dir);
      logger.debug(`Creating new database file.`);
      await writeBinaryFile(DATABASE_FILE, new Uint8Array([]), {
        dir: BaseDirectory.AppData,
      });
    }

    this._connection = await SQLite.open(file);

    logger.debug("Database connection created.");

    DB.INSTANCE = this;
  }
}
