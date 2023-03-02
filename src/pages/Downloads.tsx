import useDownload from "@/lib/hooks/useDownload";

const DownloadsPage = () => {
    const { } = useDownload();

    return (
        <div className="h-full divide-y">
            <div className="h-20">

            </div>
            <div>
                <h1>Queue</h1>
                <ul className="divide-y">
                    <li>
                        pic - name
                        <button>Dequeue</button>
                    </li>
                </ul>
            </div>

        </div>
    );
}

export default DownloadsPage;