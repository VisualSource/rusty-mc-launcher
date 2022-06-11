import { Card, Elevation, Icon } from '@blueprintjs/core';
import { useNavigate } from 'react-router-dom';
import css from './library.module.sass';

interface LibraryCardProps {
    name: string;
    path: string;
    image: string;
}

export function IconCard(){
    const navitgate = useNavigate();
    return (
        <Card className={css.icon_card} interactive={true} elevation={Elevation.TWO} onClick={()=>navitgate("/profile")}>
            <Icon icon="plus" size={20}/>
        </Card>
    );
}

export default function LibraryCard(props: LibraryCardProps){
    const navitgate = useNavigate();
    return (
        <Card className={css.library_card} interactive={true} elevation={Elevation.TWO} onClick={()=>navitgate(props.path)}>
            <img src={props.image} alt="profile preview"/>
            <div className={css.library_name}>
                <span>{props.name}</span>
            </div>
        </Card>
    )
}