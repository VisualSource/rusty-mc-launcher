import categories from "../models/categories";
import profiles from "../models/profiles";
import logger from "../system/logger";
import { DbGlobal } from "./sqlite";

const CHECK_KEY = "cat-check-0.4.0";
export async function init() {
  await DbGlobal.Get();
  if (localStorage.getItem(CHECK_KEY) === "true") return;
  await new Promise<void>((a) => setTimeout(() => a(), 500));
  logger.debug("INIT APP");

  const result = await categories.execute<{ count: number }>(
    `SELECT COUNT(*) as count FROM ${categories.name} WHERE profile_id NOT NULL;`,
  );

  if (result?.at(0)?.count === 0) {
    console.log("HELLO");
    const ids = await profiles.find({ select: { id: true } });

    await categories.execute(
      `INSERT INTO %table% (id,group_id,profile_id) VALUES ${ids
        ?.map((item) => {
          return `("${crypto.randomUUID()}",0,"${item.id}")`;
        })
        .join(",")};`,
    );
    localStorage.setItem(CHECK_KEY, "true");
  }
}
