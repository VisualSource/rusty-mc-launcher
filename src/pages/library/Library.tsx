import { useQuery } from 'react-query';
import css from './library.module.sass';
import LibraryCard, { IconCard } from './LibraryCard';
import DB from '../../lib/db';
import { Profile } from '../../types';
import { Spinner, Intent, Divider } from '@blueprintjs/core';
export default function Library(){
    const { data, isLoading, isError, error } = useQuery<Profile[],Error>("profileslist",DB.FetchProfiles);

    if(isLoading) return (
        <div className={css.lib_load}>
            <Spinner intent={Intent.PRIMARY}/>
            <h4>Loading Profiles</h4>
        </div>
    );

    if(isError) return (
        <div className={css.lib_err}>
            Failed to load profile.
            <Divider/>
            {error?.message}
        </div>
    );

    return (
        <div className={css.library}>
            {data?.map((profile,i)=>(
                <LibraryCard key={i} name={profile.name} path={`/view/${profile.uuid}`} image={profile.card} />
            ))}
            <IconCard/>
        </div>
    );
}