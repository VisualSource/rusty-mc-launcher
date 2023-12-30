import type { Client } from "@microsoft/microsoft-graph-client";
import { type AccountInfo } from "@azure/msal-browser";
import localforage from "localforage"

export type MicrosoftProfile = {
  "@odata.context": string;
  displayName: string;
  surname: string;
  givenName: string;
  id: string;
  userPrincipalName: string;
  businessPhones: string[];
  jobTitle: null | string;
  mail: null | string;
  mobilePhone: null | string;
  officeLocation: null | string;
  preferredLanguage: null | string;
}

export const getUserAccountProfile = async (account: AccountInfo, client: Client) => {
  const id = `${account.nativeAccountId ?? account.homeAccountId}-profile`;
  const data = await localforage.getItem<MicrosoftProfile | null>(id);

  if (!data) {
    const request = await client.api("/me").get();

    await localforage.setItem(id, request);

    return request;
  }

  return data;
};