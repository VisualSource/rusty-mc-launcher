import SectionDivider from "@/components/download/SectionDivider";
import useDownload from "@/lib/hooks/useDownload";

const DownloadsPage = () => {
    const { queue } = useDownload();

    return (
        <div className="h-full divide-y">
            <div className="h-20 bg-gradient-to-r from-slate-500 to-slate-800">

            </div>
            <div>
                <div className="ml-2">
                    <SectionDivider text="Up Next" count={queue.next.length}>
                        <div className="text-sm text-neutral-400">Auto-updates enabled</div>
                    </SectionDivider>
                    <div className="ml-4 text-neutral-400 text-sm tracking-tight">There are no downloads in the queue.</div>
                </div>


                {queue.completed.length ? (
                    <div>
                        <SectionDivider text="Completed" count={queue.completed.length}>
                            <button className="inline-block rounded border border-indigo-600 bg-indigo-600 px-6 py-2 text-sm font-medium text-white focus:outline-none focus:ring active:text-indigo-500">Clear All</button>
                        </SectionDivider>
                    </div>
                ) : null}
            </div>

        </div>
    );
}

export default DownloadsPage;