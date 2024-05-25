import type { ModrinthClientApplication } from "@lib/api/modrinth/auth/ModrinthClientApplication";
import { modrinthContext } from "@lib/context/ModrinthContext";

export const ModrinthProvider = ({
  client,
  children,
}: React.PropsWithChildren<{ client: ModrinthClientApplication }>) => {
  return (
    <modrinthContext.Provider value={client}>
      {children}
    </modrinthContext.Provider>
  );
};
