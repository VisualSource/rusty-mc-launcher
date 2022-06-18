import { listen } from '@tauri-apps/api/event';
import EventEmitter from 'events';
import { toast } from 'react-toastify';
import { ParseID } from './ids';
import { InstallClient, InstallNatives } from './invoke';
import type { InstallManifest } from '../types';

export type InstallType = "mod" | "modpack" | "client" | "natives_install";

/**
 * Mannager for handling install of mod,modpacks,clients,and installtion of natives
 * has queue system so mods and a client can be installed without forgeting about it.
 *
 * @export
 * @class DownloadManger
 * @extends {EventEmitter}
 */
export default class DownloadManger extends EventEmitter {
    private _queue: { type: InstallType, data: any}[] = [];
    private occupited: boolean = false;
    public downloading: string = "Downloading Resource"; 
    static INSTANCE: DownloadManger | null = null;
    static Get(): DownloadManger {
        if(DownloadManger.INSTANCE) return DownloadManger.INSTANCE;
        return new DownloadManger();
    }
    constructor(){
        if(DownloadManger.INSTANCE) return DownloadManger.INSTANCE;
        super();
        DownloadManger.INSTANCE = this;
        listen("rustydownload://download",(ev)=>{
            this.emit("download",ev.payload);
        });
        listen("rustydownload://error",(err)=>{
            this.emit("error",err.payload);
        });
        listen("rustydownload://progress",(ev)=>{
            this.emit("progress",ev.payload);
        });
        listen("rustydownload://status",(ev)=>{
            this.emit("status",ev.payload);
        });
    }
    public is_occupited(): boolean {
        return this.occupited;
    }
    private enqueue(el: any): void {
        this._queue.push(el);
        this.emit("enqueue");
    }
    private dequeue() {
        if(this.is_empty()) return null;
        this.emit("dequeue");
        return this._queue.shift();
    }
    public queue() {
        return this._queue;
    }
    public front() {
        if(this.is_empty()) return null;
        return this._queue[0];
    }
    public is_empty(): boolean {
        return this._queue.length === 0;
    }
    private async run(){
        this.occupited = true;

        const current = this.dequeue();

        this.emit("download_start");
       
        switch (current?.type) {
            case "client":{
               try {
                    this.downloading = `Minecraft Client ${current.data}`;
                    this.emit("downloading",this.downloading);

                    const data = ParseID(current.data);

                    const manifest: InstallManifest = {
                        cache_cli: true,
                        cache_install: true,
                        cache_mods: false,
                        minecraft: data.minecraft,
                        modloader: data.loader,
                        modloader_version: data.loader_version,
                        mods: []
                    }   

                   await InstallClient(manifest);
               } catch (error) {
                    console.error(error);
                    this.emit("error","Download failure");
                    toast.error("Failed to download Minecraft!");
               }
                break;
            }
            case "mod": 
                toast.error("Mod installs have not been implemented yet.");
                break;
            case "modpack":
                toast.error("Mod installs have not been implemented yet.");
                break;
            case "natives_install": {
                try {
                    this.downloading = `Natives ${current.data}`;
                    this.emit("downloading",this.downloading);
                    await InstallNatives(current.data);
                } catch (error) {
                    console.error(error);
                    this.emit("error","Download failure");
                    toast.error("Failed to install natives!");
                }
                break;
            }
            default:
                throw new Error("Unkown install type");
        }

        await new Promise<void>((k)=>setTimeout(()=>{this.emit("download_done"); k();},1000));
      
        if(!this.is_empty()) {
            this.run();
            return;
        }
        this.occupited = false;
    }
    async install(request: { type: InstallType, data: any} ){
        return new Promise<null | boolean>(async (ok,reject)=>{
            try {
                this.enqueue(request);

                if(!this.occupited) {
                    await this.run();
                    ok(true)
                } else {
                    ok(null)
                }
            } catch (error) {
                reject(error);
            }
        });
    }
}