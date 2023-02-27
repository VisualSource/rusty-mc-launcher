import useDownload from "@hook/useDownload";

const Footer = () => {
    const { } = useDownload();

    return (
        <footer className="flex h-20 bg-gray-700 justify-center shadow pt-2">
            <button className="flex flex-col items-center">
                <strong className="hover:text-gray-100 text-gray-200 text-sm">DOWNLOADS</strong>
                <span className="text-sm">Manage</span>
            </button>
        </footer>
    );
}

export default Footer;