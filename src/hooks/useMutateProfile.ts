import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type MinecraftProfile } from "@lib/models/profiles";
import { PROFILES_KEY } from "./keys";
import { db } from '@system/commands';

type RequestType = {
  type: "delete" | "patch" | "create";
  data: MinecraftProfile;
};

const mutateProfile = async (ev: RequestType) => {
  switch (ev.type) {
    case "create": {
      const uuid = crypto.randomUUID();

      await db.execute({
        query: `INSERT INTO profiles VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        args: [
          uuid,
          ev.data.name,
          ev.data.icon,
          (new Date()).toUTCString(),
          null,
          ev.data.version,
          ev.data.loader,
          ev.data.loader_version ?? null,
          ev.data.java_args ?? null,
          ev.data.resolution_width ?? null,
          ev.data.resolution_height ?? null
        ]
      })
      break;
    }
    case "delete": {
      await db.execute({ query: `DELETE FROM profiles WHERE id = ?`, args: [ev.data.id] });
      break;
    }
    case "patch": {
      const values = Object.entries(ev.data).filter(e => e[0] !== "id").map(([key, value]) => `${key}='${value?.toString() ?? 'null'}'`).join(", ");
      await db.execute({ query: `UPDATE profiles SET ${values} WHERE id = ?`, args: [ev.data.id] });
      break;
    }
    default:
      break;
  }
};

export const useMutateProfiles = () => {
  const queryClient = useQueryClient();
  const mutate = useMutation({
    mutationFn: mutateProfile,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: [PROFILES_KEY] });
    },
  });

  return mutate;
};
