import { Db } from 'zangodb';
import { RemoveModsFolder } from './invoke';
import { Profile } from '../types';
export default class DB {
    static INSTANCE: DB | null = null;
    static Get(): DB {
        if(DB.INSTANCE) return DB.INSTANCE;
        return new DB();
    }
    static async FetchProfiles(): Promise<Profile[]> {
        const db = DB.Get();
        return db.profiles.find({}).toArray() as Promise<Profile[]>
    }
    //@ts-ignore
    private db: Db;
    constructor(){
        if(DB.INSTANCE) return DB.INSTANCE;
        this.db = new Db("minecraft",1,{ profiles: ["uuid"], mods: ["uuid"], users: ["xuid"] });
        DB.INSTANCE = this;
        //@ts-ignore
        window.db = this;
        
    }
    get users(){
        return this.db.collection("users");
    }
    get profiles(){
        return this.db.collection("profiles");
    }
    get mods(){
        return this.db.collection("mods");
    }
    public async dropProfile(uuid: string): Promise<void> {

        await RemoveModsFolder(uuid);
        await this.profiles.remove({ uuid });
    }
}