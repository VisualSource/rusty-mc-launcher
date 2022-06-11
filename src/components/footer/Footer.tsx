import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DownloadManger from '../../lib/download';
import css from './footer.module.sass';
export default function Footer(){
    const navigate = useNavigate();
    const dl = useRef(DownloadManger.Get());
    const [isDownload,setIsDownload] = useState<boolean>(false);

    useEffect(()=>{
        const end = () => setIsDownload(false);
        const start = () => setIsDownload(true);

        dl.current.on("download_done",end);
        dl.current.on("download_start",start);

        return () => {
            dl.current.off("download_done",end);
            dl.current.off("download_start",start);
        }
    },[]);

    return (
        <footer className={css.footer}>
                <div onClick={()=>navigate("/download")}>
                    <span className={css.download_title}>DOWNLOADS</span>
                    <span className={css.download_subtitle}>{ isDownload ? `Downloading resouce` : "View"}</span>
                </div>
        </footer>
    );
}