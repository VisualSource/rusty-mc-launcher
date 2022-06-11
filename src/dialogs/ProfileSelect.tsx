import { Dialog} from "@blueprintjs/core";
import { atom, useRecoilState } from 'recoil';
import { useQuery } from 'react-query';
import DB from "../lib/db";
import css from './profileselect.module.sass';
import { Profile } from "../types";
import { type Mod, GetModsList } from "../pages/store/Mods";

const profileSelect = atom<{open: boolean, mod: any | null}>({ 
    key: "ProfileSelect",
    default: {
        open: false,
        mod: null
    }
 });

export const useModInstallDialog = () => {
    const dialog = useRecoilState(profileSelect);

    return dialog;
}

async function GetProfiles(): Promise<Profile[]> {
    const db = DB.Get();

    return db.profiles.find({}).toArray() as  Promise<Profile[]>;
}


export default function ProfileSelect(){
    const [dialog, setDialog] = useRecoilState(profileSelect);
    const mods = useQuery("modslist",GetModsList);
    const { data, isError, isLoading } = useQuery<Profile[]>("profileslist",GetProfiles, { enabled: !!mods.data });
    
    return (
        <Dialog hasBackdrop isOpen={dialog.open} className={css.dialog + " bp4-dark"} title="Select profile to install mod to" onClose={()=>setDialog({open:false,mod: null})}>
            <main className={css.profile_list}>
                {dialog.mod && !isLoading && !isError && data?.filter((value)=>{
                    return (dialog.mod as Mod).minecraft.some(a=>value.lastVersionId.includes(a)) && (dialog.mod as Mod).loaders.some(b=>value.lastVersionId.includes(b));
                }).map((pro,i)=>(
                    <div key={i} className={css.profile} onClick={()=>{  setDialog({ open: false, mod: null });  }}>
                        <img src={pro.icon} alt="preview"/>
                        <div>
                            <h4>{pro.name}</h4>
                        </div>
                    </div>
                ))}
            </main>
        </Dialog>
    );
}