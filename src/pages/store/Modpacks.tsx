import StoreItem from "./StoreItem";
import { useQuery } from 'react-query';
import { Spinner } from "@blueprintjs/core";
import { useDeferredValue, useEffect, useState } from "react";
import { useOutletContext } from 'react-router-dom';
import css from './view.module.sass';
import { Loader, Minecraft } from "../../types";
import { CreateModpack } from "../../lib/install";
import { Log } from "../../lib/invoke";
import { toast } from "react-toastify";

export interface ModPack {
    uuid: string;
    update: string;
    description: string;
    tags: string[];
    minecraft: Minecraft[];
    loaders: Loader[];
    name: string;
    icon: string;
    card: string;
    banner: string;
    author: string;
    mods: string[];
}

async function GetModpacks(){
    const request = await fetch(`${process.env.REACT_APP_DATA_API}/modpacks.json`);

    const data = request.json();
  
    return data;
}

export default function Modspacks(){
    const ctx = useOutletContext<{ tags: string[] }>();
    const { data, isError, isLoading, error } = useQuery<ModPack[],Error>("modpacklist",GetModpacks);
    const [modpacks,setModPacks] = useState<ModPack[]>([]);
    const tags = useDeferredValue<string[]>(ctx.tags);

    useEffect(()=>{
        const search = async () => {
            if(isLoading) return;
            if(!data) return;
            if(tags.length === 0) {
                setModPacks(data);
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
            setModPacks(wanted);
        }
        search();
    },[tags,data,isLoading]);

    const install_callback = async (install: ModPack) => {
        try {
            toast.info("Starting modpack install!");
            await CreateModpack(install);
            toast.success("Installed mod pack!");
        } catch (error) {
            toast.error("Failed to install modpack");
            console.error(error);
            if(error instanceof Error) Log(error.message);
        }
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
            {modpacks.map((value,i)=>(
                <StoreItem install={install_callback} {...value} key={i}/>
            ))}
        </>
    );
}