import { listen } from '@tauri-apps/api/event';
import EventEmitter from 'events';
import { toast } from 'react-toastify';
import { ParseID, StringHash } from './ids';
import { InstallClient, InstallNatives, Log, InstallMods, UpdateModList, InstallRuntime } from './invoke';
import type { InstallManifest } from '../types';

export type InstallType = "install_mods" | "update_mods" | "client" | "natives_install" | "install_runtime";
type DownloadRequest = { type: InstallType, data: any, id: number };


/**
 * Mannager for handling install of mod,modpacks,clients,and installtion of natives
 * has queue system so mods and a client can be installed without forgeting about it.
 *
 * @export
 * @class DownloadManger
 * @extends {EventEmitter}
 */
export default class DownloadManger extends EventEmitter {
    private _queue: DownloadRequest[] = [];
    private occupited: boolean = false;
    private current: DownloadRequest | null | undefined;
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
    private enqueue(el: { type: InstallType, data: any}): boolean {

        let data = { ...el, id: StringHash(JSON.stringify(el.data)) };

        if(this.current?.id === data.id) {
            return false;
        }

        if(this._queue.some(value=>value.id===data.id)) {
            return false;
        }

        this._queue.push(data);
        this.emit("enqueue");
        return true;
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
    private async run(): Promise<void> {
        this.occupited = true;

        this.current = this.dequeue();

        if(!this.current) return;

        this.emit("download_start");
       
        switch (this.current.type) {
            case "client":{
               try {
                    this.downloading = `Minecraft Client ${this.current.data}`;
                    this.emit("downloading",this.downloading);

                    const data = ParseID(this.current.data);

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
            case "install_runtime": {
                try {
                    this.downloading = `Minecraft Runtime for ${this.current.data}`;
                    this.emit("downloading",this.downloading);

                    const data = ParseID(this.current.data);

                    await InstallRuntime(data.minecraft);
                } catch (error) {
                    console.error(error);
                    this.emit("error","Download failure");
                    toast.error("Failed to download Minecraft runtime!");
                }
                break;
            }
            case "install_mods": {
                try {
                    this.downloading = `Installing mods`;
                    this.emit("downloading",this.downloading);
                    
                    await InstallMods(this.current.data.profile,this.current.data.mods);
                    

                    toast.info("Finished Downloading Mods");
                } catch (error: any) {
                    console.error(error);
                    this.emit("error","Download failure");
                    toast.error("There was an error in download a mod");
                    if(error instanceof Error) Log(error.message,"error");
                }
                break;
            }
            case "update_mods": {
              try {
                this.downloading = `Updating mods`;
                this.emit("downloading",this.downloading);

                await UpdateModList(this.current.data.profile,this.current.data.mods);

              } catch (error) {
                console.error(error);
                this.emit("error","Download failure");
                toast.error("There was an error in download a mod");
                if(error instanceof Error) Log(error.message,"error");
              }
              break;
            }
            case "natives_install": {
                try {
                    this.downloading = `Natives ${this.current.data}`;
                    this.emit("downloading",this.downloading);
                    await InstallNatives(this.current.data);
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
        return new Promise<boolean>(async (ok,reject)=>{
            try {
                if(!this.enqueue(request)) {
                    return ok(true);
                }

                if(!this.occupited) {
                    await this.run();
                    ok(true)
                } else {
                    ok(false)
                }
            } catch (error) {
                reject(error);
            }
        });
    }
}