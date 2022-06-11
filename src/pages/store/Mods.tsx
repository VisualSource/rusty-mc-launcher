import StoreItem from "./StoreItem";
import { useQuery } from 'react-query';
import { Spinner } from "@blueprintjs/core";
import css from './view.module.sass';
import { Loader, Minecraft } from '../../types';
import { useOutletContext } from 'react-router-dom';
import { useDeferredValue, useEffect, useState } from "react";
import { useModInstallDialog } from '../../dialogs/ProfileSelect';
export interface Mod {
    update: string;
    uuid: string;
    description: string;
    icon: string;
    name: string;
    author: string;
    tags: string[];
    minecraft: Minecraft[];
    loaders: Loader[];
    required: {
        [loader: string]: string[]
    } | null
    inconpatable: {
        [loader: string]: string[]
    } | null
    download: {
        [loader: string]: {
            [minecraft: string]: {
                url: string;
                version: string;
            }
        }
    }
}

export async function GetModsList(): Promise<Mod[]> {
    const request = await fetch(`${process.env.REACT_APP_DATA_API}/mods.json`);

    const data = request.json();
  
    return data;
}

export default function Mods(){
    const ctx = useOutletContext<{ tags: string[] }>();
    const { data, isError, isLoading, error } = useQuery<Mod[],Error>("modslist",GetModsList);
    const [mods,setMods] = useState<Mod[]>([]);
    const tags = useDeferredValue<string[]>(ctx.tags);
    const [dialog,setDialog] = useModInstallDialog();

    useEffect(()=>{
        const search = async () => {
            if(isLoading) return;
            if(!data) return;
            if(tags.length === 0) {
                setMods(data);
                return;
            }
            const wanted = data?.filter((mod)=>{
                return (
                    tags.includes(mod.name) || 
                    tags.some(tag=>mod.loaders.includes(tag as any)) ||
                    tags.some(tag=>mod.tags.includes(tag)) ||
                    tags.some(tag=>mod.minecraft.includes(tag as any)) ||
                    tags.includes(mod.author)
                )

            });
            setMods(wanted);
        }
        search();
    },[tags,data,isLoading]);
    

    const install_callback = (mod: Mod) => {
        setDialog({ open: true, mod });
    }

    if(isError) return (
        <div className={css.loader}>  
            <div className={css.error}>
               <h4>Failed to load</h4>
               <div>{error?.message}</div>
            </div>
        </div>
    );

    if(isLoading) return (
        <div className={css.loader}>
            <Spinner/>
            <h4>Loading</h4>
        </div>
    );
    
    return (
        <>
            {mods.map((value,i)=>(<StoreItem key={i} install={install_callback} {...value} />)) }
        </>
    );
}