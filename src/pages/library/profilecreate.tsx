import { InputGroup, HTMLSelect, NumericInput, Button, Intent, Divider, Spinner } from '@blueprintjs/core';
import { nanoid } from 'nanoid';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import DB from '../../lib/db';
import { GetLoaderBanner, GetLoaderCard, GetLoaderIcon, StringifyID } from '../../lib/ids';
import css from './createprofile.module.sass';
import type { Loader, Minecraft, Profile } from '../../types';
import { GetLoaderVersions, GetVanillaVersions } from '../../lib/invoke';

const check = (a: FormDataEntryValue | null, def: string): string => {
    if(!a) return def;
    const value = a.toString();
    if(value.length === 0) return def;
    return value;
}

async function CreateNewProfile(ev: React.FormEvent<HTMLFormElement>, minecraft: Minecraft[]) {
    ev.preventDefault();
    const data = new FormData(ev.target as HTMLFormElement);
    const created = new Date().toISOString();
    const lastVersionId = StringifyID(
        data.get("version-part1") as string | null,
        data.get("version-part2") as string | null,
        data.get("version-part3") as string | null,
        minecraft
        );
    const db =  DB.Get();

    const profile: Profile = {
            isModpack: false,
            uuid: nanoid(),
            category: check(data.get("category"),"DEFAULT").toUpperCase(),
            card: check(data.get("card"),GetLoaderCard(lastVersionId)),
            banner: check(data.get("banner"),GetLoaderBanner(lastVersionId)),
            icon: check(data.get("icon"),GetLoaderIcon(lastVersionId)),
            type: "custom",
            mods: [],
            lastVersionId,
            created,
            lastUsed: created,
            name: check(data.get("name"),"Minecraft")
    };

    const javaArgs = data.get("javaArgs");
    if(javaArgs) profile.javaArgs = javaArgs.toString();
        
    const gameDir = data.get("gameDir");
    if(gameDir) profile.gameDir = gameDir.toString();

    const Width = data.get("res_width");
    const Height = data.get("res_height");

    if(Width || Height) {
        profile.resolution = {
            width: Width ? parseInt(Width.toString()) : 1920,
            height: Height ? parseInt(Height.toString()) : 1080 
        }
    }

    const javaDir = data.get("javaDir");
    if(javaDir) profile.javaDir = javaDir.toString();

    await db.profiles.insert(profile);
}


export default function CreateProfile() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [loader,setLoader] = useState<(Loader | "none")>("none");
    const [mc,setMC] = useState<Minecraft | "latest-release">("latest-release");
    const minecraft = useQuery("mclist",()=>GetVanillaVersions());
    const loaders = useQuery(["loaderlist",loader,mc],()=>GetLoaderVersions(loader,mc === "latest-release" ? (minecraft as any).data.at(0) : mc),  { enabled: !!minecraft?.data });
    const mutation = useMutation<any,any,any>((ev)=>CreateNewProfile(ev,minecraft.data as Minecraft[]), { 
        onSuccess() {
            queryClient.invalidateQueries("profileslist");
            navigate("/");
        } 
    });

    if(minecraft.isError || loaders.isError) return (
        <div className={css.error}>
            Failed to load required data, try again later.
            <Divider/>
            Reason: {(minecraft.error as any)?.message ?? (loaders.error as any)?.message}
        </div>
    );
    
    if(minecraft.isLoading || loaders.isLoading) return (
        <div className={css.loading}>
            <Spinner/>
            <h3>Loading Version Data</h3>
        </div>
    );
    
    return (
        <form className={css.profile} onSubmit={mutation.mutate}>
            <h3>Create New Profile</h3>
            <Divider/>
            <div className={css.setting_field}>
                <h4>Name</h4>
                <InputGroup defaultValue='Vanilla 1.18.2' name='name' required placeholder="Profile name"/>
            </div>
            <div className={css.setting_field}>
                <h4>Category</h4>
                <InputGroup defaultValue='DEFAULT' name="category" required placeholder="Category"/>
            </div>
            <div className={css.setting_field}>
                <h4>Minecraft</h4>
                <HTMLSelect required name="version-part1" value={mc} fill onChange={value=>setMC(value.currentTarget.value as Minecraft)}>
                    <option value="latest-release">Latest Release</option>
                    {minecraft.data?.map((value,i)=>(
                        <option value={value} key={i}>{value}</option>
                    ))}
                </HTMLSelect>
            </div>
            <div className={css.setting_field}>
                <h4>Loader</h4>
                <HTMLSelect fill name="version-part2" value={loader} onChange={(value)=>setLoader(value.currentTarget.value as Loader)}>
                    <option value="none">None</option>
                    <option value="fabric">Fabric</option>
                    <option value="forge">Forge</option>
                    <option value="optifine">OptiFine</option>
                </HTMLSelect>
            </div>
            <Divider/>
            <div className={css.create_btn}>
                <Button text="Create" intent={Intent.SUCCESS} type="submit"/>
            </div>
            <h3>Profile Media Settings</h3>
            <div className={css.setting_field}>
                <h4>Icon</h4>
                <InputGroup name="icon" placeholder="DEFAULT"/>
            </div>
            <div className={css.setting_field}>
                <h4>Banner</h4>
                <InputGroup name="banner" placeholder="DEFAULT"/>
            </div>
            <div className={css.setting_field}>
                <h4>Card</h4>
                <InputGroup name="card" placeholder="DEFAULT"/>
            </div>
            <Divider/>
            <div className={css.create_btn}>
                <Button text="Create" intent={Intent.SUCCESS} type="submit"/>
            </div>
            <h3>Adv Settings</h3>
            <div className={css.setting_field}>
                <h4>Loader version</h4>
                <HTMLSelect name="version-part3" fill>
                    {loaders.data?.map((value,i)=>(
                        <option value={value} key={i}>{value}</option>
                    ))}
                </HTMLSelect>
            </div>
            <div className={css.setting_field}>
                <h4>JVM</h4>
                <InputGroup name="javaArgs" placeholder="Jvm args"/>
            </div>
            <div className={css.setting_field}>
                <h4>.minecraft</h4>
                <InputGroup name='gameDir' placeholder=".minecraft folder/game directory"/>
            </div>
            <div className={css.setting_field}>
                <h4>Resolution</h4>
                <div className={css.resolution_fields}>
                    <h5>Width</h5>
                    <NumericInput name='res_width' placeholder="Width" fill/>
                    <h5>Height</h5>
                    <NumericInput name='res_height' placeholder="Height" fill/>
                </div>
            </div>
            <div className={css.setting_field}>
                <h4>Java</h4>
                <InputGroup name="javaDir" placeholder="<INTERNAL>"/>
            </div>
            <Divider/>
            <div className={css.create_btn}>
                <Button text="Create" intent={Intent.SUCCESS} type="submit"/>
            </div>
            <div className={css.divider}></div>
        </form>
    );
}