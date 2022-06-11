import { useEffect, useState, useRef } from "react";
import DownloadManger from "../../lib/download";
import css from "./download.module.sass";
export default function Download(){
    const dl = useRef(DownloadManger.Get());
    const [isDownloading,setIsDownloading] = useState<boolean>(false);
    const [status,setStatus] = useState<string>("");
    const [download,setDownload] = useState<string>("");
    const [progress,setProgress] = useState<number[]>([0,0]);
    const [error,setError] = useState<string>("");
    const [queue,setQueue] = useState<any[]>([]);
    const [downloading,setDownloading] = useState<string>("Downloading Resource");

    useEffect(()=>{
        const di = (ev: any)=>setDownloading(ev);
        const enqueue = ()=>setQueue(dl.current.queue());
        const dequeue = ()=>setQueue(dl.current.queue());
        const pro = (ev: any)=>setProgress(ev);
        const err = (err: any)=>setError(err);
        const stat = (ev: any)=>setStatus(ev);
        const dn = (ev: any)=>setDownload(ev);
        const dd = ()=>{
            setStatus("");
            setDownload("");
            setProgress([]);
            setError("");
            setQueue([]);
            setIsDownloading(false);
            setDownloading("No Download")
        };
        const ds = ()=>setIsDownloading(true);
        
        di(dl.current.downloading);
        setIsDownloading(dl.current.is_occupited());
        setQueue(dl.current.queue());

        dl.current.on("downloading",di);
        dl.current.on("enqueue",enqueue);
        dl.current.on("dequeue",dequeue);
        dl.current.on("progress",pro);
        dl.current.on("error",err);
        dl.current.on("status",stat);
        dl.current.on("download",dn);
        dl.current.on("download_done",dd);
        dl.current.on("download_start",ds);

        return () => {
            dl.current.off("downloading",di);
            dl.current.off("enqueue",enqueue);
            dl.current.off("dequeue",dequeue);
            dl.current.off("progress",pro);
            dl.current.off("error",err);
            dl.current.off("status",stat);
            dl.current.off("download",dn);
            dl.current.off("download_done",dd);
            dl.current.off("download_start",ds);
        }
    },[]);

    return (
        <main className={css.downloads}>
            <div className={css.current_download}>

            { isDownloading ? (
                <div className={css.download_info}>
                    <span>Status: {status}</span>
                    <span>Error: {error}</span>
                    <span>Dowload: {download}</span>
                    <span> File {progress[1]} of {progress[0]}</span>
                    <span>Downloaing: {downloading}</span>
                </div>
            ) : null }
            </div>
            <div className={css.download_divider}>
                <div>Up Next <span className={css.queded}>({queue.length})</span></div>
                <hr/>
            </div>
            <div className={css.queue}>
                {queue.map((value,i)=>(
                    <div key={i} className={css.queue_item}>
                        Item {value?.data}
                    </div>
                ))}
            </div>
        </main>
    );
}