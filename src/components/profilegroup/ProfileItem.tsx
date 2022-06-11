import css from './profileitem.module.sass';
import { useNavigate } from 'react-router-dom';

interface ProfileItemProps {
    name: string;
    path: string;
    icon?: string
}

export default function ProfileItem(props: ProfileItemProps){
    const navigate = useNavigate();
    return (
        <div className={css.item} onClick={()=>navigate(props.path)}>
            <img src={props?.icon ?? "/pack.png"} alt="preview"/>
            <span className={css.name}>{props.name}</span>
        </div>
    )
}