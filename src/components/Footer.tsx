import useFormatSize from "@/lib/hooks/useFormatSize";
import useDownload from "@hook/useDownload";
import { Link } from "react-router-dom";

const Footer = () => {
    const { queueCurrent } = useDownload();
    const size = useFormatSize();

    return (
        <footer className="flex h-20 bg-gray-800 justify-center shadow pt-2">
            <Link to="downloads" className="flex flex-col items-center">
                {queueCurrent ? (
                    <>
                        <strong className="hover:text-gray-100 text-gray-200 text-sm">Installing {queueCurrent.type} - {queueCurrent.msg}</strong>
                        <span className="text-sm">{size(queueCurrent?.size_current)} of {size(queueCurrent.size)}</span>
                    </>
                ) : (
                    <>
                        <strong className="hover:text-gray-100 text-gray-200 text-sm">DOWNLOADS</strong>
                        <span className="text-sm">Manage</span>
                    </>
                )}
            </Link >
        </footer >
    );
}

export default Footer;