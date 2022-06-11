import { Divider, Spinner } from '@blueprintjs/core';
import { getVersion, getTauriVersion, getName } from '@tauri-apps/api/app';
import { useEffect, useState } from 'react';
import css from './settings.module.sass';

export default function Settings(){
    const [loading, setLoading] = useState<boolean>(true);
    const [info,setInfo] = useState< { name: string, version: string, tauri: string } | undefined >();

    useEffect(()=>{
        const load = async () => {
            setLoading(true);
            try {
                const [version,tauri,name] = await Promise.all([ getVersion(), getTauriVersion(), getName() ])
                setInfo({ version, tauri, name  });
            } catch (error) {
                console.error(error);   
            }
            setLoading(false);
        }
        load();
    },[]);


    if(loading) return (
        <div className={css.settings_load}>
            <Spinner/>
            <h4>Loading Settings</h4>
        </div>
    );

    return (
        <div className={css.settings}>
            <div className={css.opt}>
                <h2>Settings</h2>
                <Divider/>
            </div>
            <div className={css.settings_info}>
                <h2>Info</h2>
                <Divider/>
                <span>Tauri Version: {info?.tauri}</span>
                <span>{ info?.name } {info?.version}</span>
            </div>
        </div>
    );
}