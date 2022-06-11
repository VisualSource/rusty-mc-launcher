import { Button, Intent } from '@blueprintjs/core';
import { useQuery } from 'react-query';
import { Outlet, useNavigate } from 'react-router-dom';
import ProfileGroup from '../../components/profilegroup/ProfileGroup';
import ProfileItem from '../../components/profilegroup/ProfileItem';
import DB from '../../lib/db';
import { Profile } from '../../types';
import groupBy from 'lodash.groupby';
import css from './layout.module.sass';

export default function Layout(){
    const navigate = useNavigate();
    const {data, isLoading, isError, error} = useQuery<Profile[],Error>("profileslist",DB.FetchProfiles);

    return (
        <div className={css.layout_base}>
            <aside className={css.layout_aside}>
                <Button text="New Profile" intent={Intent.PRIMARY} fill icon="plus" onClick={()=>navigate("/profile")}/>
                {isLoading ? "Loading" : isError ? error?.message : Object.entries(groupBy<Profile[]>(data,"category")).map(([key,value],i)=>(
                    <ProfileGroup name={key} key={i}>
                        {(value as Array<Profile>).map((pro,idx)=>(
                            <ProfileItem name={pro.name} path={`/view/${pro.uuid}`} key={idx} icon={pro.icon}/>
                        ))}
                    </ProfileGroup>
                )) }
            </aside>
            <main className={css.layout_main}>
                <Outlet/>
            </main>
        </div>
    );
}