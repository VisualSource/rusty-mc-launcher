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

    useEffect(()=>{
        
        setIsDownloading(dl.current.is_occupited());
        setQueue(dl.current.queue());

        dl.current.on("enqueue",()=>setQueue(dl.current.queue()));
        dl.current.on("dequeue",()=>setQueue(dl.current.queue()));
        dl.current.on("progress",(ev)=>setProgress(ev));
        dl.current.on("error",(err)=>setError(err));
        dl.current.on("status",(ev)=>setStatus(ev));
        dl.current.on("download",(ev)=>setDownload(ev));
        dl.current.on("download_done",()=>{
            setStatus("");
            setDownload("");
            setProgress([]);
            setError("");
            setQueue([]);
            setIsDownloading(false);
        });
        dl.current.on("download_start",()=>{
            setIsDownloading(true);
        });

        return () => {
            dl.current.removeAllListeners("enqueue");
            dl.current.removeAllListeners("dequeue");
            dl.current.removeAllListeners("progress");
            dl.current.removeAllListeners("error");
            dl.current.removeAllListeners("status");
            dl.current.removeAllListeners("dowload");
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
                    <span>Downloaing: {"Minecraft Client 1.19"}</span>
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