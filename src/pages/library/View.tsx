import { Button, Divider, Intent, Spinner } from "@blueprintjs/core";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import DB from "../../lib/db";
import { RunMinecraft, CheckVersion } from '../../lib/invoke';
import { useUser } from "../../components/account/Account";
import DownloadManger from "../../lib/download";
import css from "./view.module.sass";
import type { Profile } from "../../types";

const parseTime = (time: string): string => {
    const formater = Intl.DateTimeFormat("en-us",{});
    const og = Date.parse(time);
    return formater.format(og);
} 

async function GetProfile(uuid: string): Promise<Profile> {
    const db = DB.Get();
    const profile = await db.profiles.findOne({ uuid }) as Promise<Profile>;
    return profile;
}

async function handleMutation(ev: { type: "edit" | "del", data: any }){
    const db = DB.Get();

    if(ev.type === "del") {
        await db.profiles.remove({ uuid: ev.data });
        return ev.type;
    }

    await db.profiles.update({ uuid: ev.data.uuid },ev.data);

   return ev.type;
}

export default function View(){
    const user = useUser();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { uuid } = useParams();
    const mutate = useMutation(handleMutation, { 
        async onSuccess(data) {
            if(data === "del") {
                await queryClient.invalidateQueries("profileslist");
                return navigate('/');
            }
            await queryClient.invalidateQueries(["profile",uuid]);
    }, });
    const { data, error, isError, isLoading  } = useQuery<Profile,Error>(["profile",uuid],()=>GetProfile(uuid as string),{ enabled: !!uuid });
   
    const run = async () => {
        try {
            if(!user.active || !user.profile) throw new Error("User is not authorized");
            if(!data) throw new Error("Profile is invaild");
            
            const [installed,check_type] = await CheckVersion(data.lastVersionId);
            
            if(!installed) {
                switch (check_type) {
                    case "no_jar":
                    case "no_manifest":
                    case "no_root": {
                        toast.info(`Installing ${data.lastVersionId}`);
                        const res = await DownloadManger.Get().install({ type: "client", data: data.lastVersionId });
                        if(res === null) return navigate("/download");
                        break;
                    }
                    case "no_natives": {
                        toast.info(`Installing Natives for ${data.lastVersionId}`);
                        const res = await DownloadManger.Get().install({ type: "natives_install", data: data.lastVersionId });
                        if(res === null) return navigate("/download");
                        break;
                    }
                }
            }
        
            // if modded do mod handling
            // probbly would do modpack update checking here

            await toast.promise(RunMinecraft({ profile: user.profile, version: data.lastVersionId }),{
                pending: "Launching Minecraft",
                error: "Failed to launch Minecraft",
                success: "Launched Minecraft"
            });
        } catch (error) {
            console.error(error);
        }
    }

    if(isError) return (
        <div>{error?.message}</div>
    );

    if(isLoading) return (
        <div>
            <Spinner/>
            Loading Profile
        </div>
    );
   
    return (
        <div className={css.view}>
            <header className={css.header}>
                <img src={data?.banner} alt="profile banner"/>
                <div>
                    <Button disabled={!(user?.active)} icon="play" large text={user?.active ? `Play: ${data?.name}` : "Login to play." } intent={user?.active ? Intent.SUCCESS : Intent.DANGER} onClick={run}/>
                    <div>
                        <h4>Last Played</h4>
                        <span>{parseTime(data?.lastUsed ?? new Date().toISOString())}</span>
                    </div>
                    <div>
                        <h4>Created</h4>
                        <span>{parseTime(data?.created ?? new Date().toISOString())}</span>
                    </div>
                </div>
            </header>
            <main className={css.view_main}>
                <div className={css.view_quick_links}>
                    <h3>Quick Links</h3>
                    <a href="#info">Info</a>
                    <a href="#general">General Settings</a>
                    <a href="#mods">Mods</a>
                    <a href="#adv">Advanced Settings</a>
                </div>
                <Divider/>
                <div className={css.group}>
                    <h3 id="info">Info</h3>
                    <Divider/>
                    <div>UUID: {data?.uuid}</div>
                    <div>Minecraft: {data?.lastVersionId}</div>
                    <div>Modpack: {JSON.stringify(data?.isModpack)}</div>
                </div>
                <div>
                    <h3 id="#general">Settings</h3>
                    <Button text="Delete Profile" icon="trash" intent={Intent.DANGER} onClick={()=>mutate.mutate({ type: "del", data: uuid })}/>
                </div>
            </main>
        </div>
    );
}