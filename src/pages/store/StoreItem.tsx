import { Button, Card, Tag, Intent, Elevation} from '@blueprintjs/core';
import css from './mod.module.sass';

interface StoreItemProps {
    icon: string;
    name: string;
    loaders: string[];
    author: string;
    update: string;
    description: string;
    minecraft: string[];
    tags: string[];
    uuid: string;
    install: (source: any) => void
}

export default function StoreItem(props: StoreItemProps){
    return (
        <Card interactive elevation={Elevation.TWO}>
            <div className={css.mod_general}>
                <img src={props.icon} alt="mod preview"/>
                <div>
                    <h2>{props.name}</h2>
                    <div className={css.mod_tags}>
                        {props.loaders.map((loader,i)=> (<Tag key={i} minimal>{loader.replace(/^\w/, (c) => c.toUpperCase())}</Tag>))  }
                    </div>
                </div>
                <div className={css.install_opt}>
                    <Button text="Install" icon="add" intent={Intent.SUCCESS} large onClick={()=>{ props.install(props); }}/>
                    <div>Author: {props.author}</div>
                    <div>Updated {props.update}</div>
                </div>
            </div>
            <p className={css.description}>{props.description}</p>
            <div className={css.supported}>
                Minecraft:  
                <div>
                    {props.minecraft.map((value,i)=>(<Tag key={i} minimal>{value}</Tag>))}
                </div>
            </div>
            <div className={css.mod_tags}>
                 {props.tags.map((value,i)=>(<Tag key={i} minimal>{value}</Tag>))}
            </div>
        </Card>
    );
}