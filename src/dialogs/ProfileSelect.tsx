import { Dialog, Divider, Spinner} from "@blueprintjs/core";
import { atom, useRecoilState, useSetRecoilState } from 'recoil';
import { useQuery } from 'react-query';
import DB from "../lib/db";
import css from './profileselect.module.sass';
import type { Profile } from "../types";
import { type Mod, GetModsList } from "../pages/store/Mods";
import { SatisfiesMinecraftVersion } from "../lib/ids";
import { AddModToProfile } from "../lib/install";
import DownloadManger from "../lib/download";
import { useErrorDialog } from '../dialogs/ErrorDialog';

const profileSelect = atom<{open: boolean, mod: any | null}>({ 
    key: "ProfileSelect",
    default: {
        open: false,
        mod: null
    }
 });

export const useModInstallDialog = () => {
    const dialog = useSetRecoilState(profileSelect);

    return dialog;
}

async function GetProfiles(): Promise<Profile[]> {
    const db = DB.Get();

    return db.profiles.find({}).toArray() as  Promise<Profile[]>;
}


export default function ProfileSelect(){
    const errorDialog = useErrorDialog();
    const [dialog, setDialog] = useRecoilState(profileSelect);
    const mods = useQuery("modslist",GetModsList);
    const { data, isError, isLoading, error } = useQuery<Profile[],Error>("profileslist",GetProfiles, { enabled: !!mods.data });
    
    const search = () => {
        if(!dialog.mod) return null;

        if(isLoading) return (
            <div className={css.loader}>
                <Spinner/>
                <h4>Loading</h4>
            </div>
        )
        if(isError) return (
            <div className={css.load_error}>
                <span>Failed to load</span>
                <Divider/>
                <span>{error?.message ?? "There was an error"}</span>
            </div>
        );


        let value = data?.filter((value)=>{
            return (dialog.mod as Mod).minecraft.some(a=>SatisfiesMinecraftVersion(value.lastVersionId,a)) && (dialog.mod as Mod).loaders.some(b=>value.lastVersionId.includes(b));
        }).map((pro,i)=>(
            <div key={i} className={css.profile} onClick={async ()=>{
                setDialog({ open: false, mod: null });
                if(!mods.data) return;
                try {
                    const output = AddModToProfile(dialog.mod,pro,mods.data);
                    const db = DB.Get();
                    db.profiles.update({ uuid: output.profile.uuid }, output.profile);
                    const dl = DownloadManger.Get();
                    await dl.install({ type: "mod", data: { profile: output.profile.uuid, mod: output.download } });
                } catch (error: any) {
                    errorDialog({ open: true, error: error });
                }
            }}>
                <img src={pro.icon} alt="preview"/>
                <div>
                    <h4>{pro.name}</h4>
                </div>
            </div>
        ));

        if(!value || value?.length === 0 ) return (
            <div className={css.no_profiles}>
                <h4>No vaild profiles to install to.</h4>
            </div>
        );

        return value;
    }


    return (
        <Dialog hasBackdrop isOpen={dialog.open} className={css.dialog + " bp4-dark"} title="Select profile to install mod to" onClose={()=>setDialog({open:false,mod: null})}>
            <main className={css.profile_list}>
                {search()}
            </main>
        </Dialog>
    );
}