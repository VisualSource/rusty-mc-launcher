import { TagInput, Divider } from "@blueprintjs/core";
import { useState } from "react";
import { Outlet } from "react-router-dom";

import css from './layout.module.sass';

export default function Layout(){
    const [search,setSearch] = useState<string[]>([]);

    return (
        <main className={css.layout}>
            <header>
                <TagInput tagProps={{ minimal: true }} leftIcon="search" placeholder="Search" values={search} onAdd={(tags)=>{ 
                    setSearch(search.concat(tags.filter(a=>!search.includes(a))));
                }} onRemove={(tag)=>{ setSearch(search.filter((a)=> a!==tag?.toString())) }} />
            </header>
            <Divider/>
            <div className={css.store_list}>
                <Outlet context={{ tags: search }}/>
            </div>
        </main>
    );
}