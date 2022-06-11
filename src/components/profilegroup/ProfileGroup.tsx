import { Collapse, Icon } from "@blueprintjs/core";
import { useState } from 'react';
import css from './profilegroup.module.sass';

interface ProfileGroupProps {
    name: string;
    children: any
}

export default function ProfileGroup(props: ProfileGroupProps) {
    const [open,setOpen] = useState<boolean>(false);
    return (
        <div className={css.group}>
            <header className={css.group_header} onClick={()=>setOpen(!open)}>
                <Icon icon={open ? "minus" : "plus"}/>
                <span className={css.name}>{props.name}</span>
                <div>({Array.isArray(props?.children) ? props.children?.length : props?.children ? 1 : 0 })</div> 
            </header>
            <Collapse isOpen={open} className={css.collapse}>
                {props.children}
            </Collapse>
        </div>
    );
}