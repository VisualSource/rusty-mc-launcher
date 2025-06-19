import { addSeconds, compareAsc } from "date-fns";
import { followProject, getFollowedProjects, getUserFromAuth, unfollowProject, type User } from "../api/modrinth";
import { modrinthAuthenticate } from "../api/plugins/auth";

type ModrinthAccount = User;
export class ModrinthClientApplication extends EventTarget {
    public isAuthed = false;
    public isLoading = false;
    private user: ModrinthAccount | null = null;
    private details: { access_token: string; expires: Date } | null = null;

    async initialize(): Promise<void> {
        const account = localStorage.getItem("modrinth");
        if (!account) return;

        const data = JSON.parse(atob(account)) as { token: string; expires: string; }

        this.details = {
            access_token: data.token,
            expires: new Date(data.expires)
        }
        const { error, data: user } = await getUserFromAuth({
            auth: this.details.access_token
        });
        if (error) throw error;
        this.user = user;
        this.isAuthed = true;
        this.dispatchEvent(new CustomEvent("update-data"));
    }

    async acquireTokenPopup(): Promise<{ access_token: string; expires: Date }> {
        if (this.details && compareAsc(new Date(), this.details.expires) === -1) {
            return this.details;
        }

        const result = await modrinthAuthenticate();

        const details = {
            access_token: result.access_token,
            expires: addSeconds(new Date(), result.expires_in)
        }

        this.details = details;

        this.isAuthed = true;

        return this.details;
    }

    getActiveAccount(): ModrinthAccount | null {
        return this.user;
    }

    async getFollowed() {
        if (!this.user) throw new Error("No user logged in!");

        const { data, error } = await getFollowedProjects({
            path: {
                "id|username": this.user.id
            }
        });

        if (error) throw error;

        return data;
    }

    async unfollowProject(projectId: string) {
        const details = await this.acquireTokenPopup();

        const { data, error } = await unfollowProject({
            auth: details.access_token,
            path: {
                "id|slug": projectId
            }
        });

        if (error) throw error;
        return data;
    }

    async followProject(projectId: string) {
        const details = await this.acquireTokenPopup();

        const { data, error } = await followProject({
            auth: details.access_token,
            path: {
                "id|slug": projectId
            }
        });

        if (error) throw error;
        return data;
    }

    async loginPopup() {
        const details = await this.acquireTokenPopup();

        const { error, data: user } = await getUserFromAuth({
            auth: details.access_token
        });
        if (error) throw error;

        this.user = user;

        localStorage.setItem("modrinth", btoa(JSON.stringify({
            token: details.access_token,
            expires: details.expires.toISOString()
        })));

        this.dispatchEvent(new CustomEvent("update-data"));

        return {
            user,
            details
        };
    }

    logout() {
        localStorage.removeItem("modrinth");

        this.user = null;
        this.details = null;
        this.isAuthed = false;

        this.dispatchEvent(new CustomEvent("update-data"));
    }
}