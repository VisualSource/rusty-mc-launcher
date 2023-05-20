import SectionDivider from "@/components/download/SectionDivider";
import useDownload from "@hook/useDownload";
import useFormatSize from "@hook/useFormatSize";

const DownloadsPage = () => {
    const size = useFormatSize();
    const { queueCurrent, queueCompleted, queueNext, clearCompleted } = useDownload();

    return (
        <div className="h-full divide-y">
            <div className="h-20 bg-gradient-to-r from-slate-500 to-slate-800">
                {queueCurrent ? (
                    <div className="flex flex-col flex-wrap">
                        <div>{queueCurrent?.msg}</div>
                        <div>{size(queueCurrent?.size_current)} of {size(queueCurrent?.size)}</div>
                        <div>{queueCurrent?.ammount_current} of {queueCurrent?.ammount}</div>
                        <div>{queueCurrent?.download?.file}: {size(queueCurrent.download?.size ?? 0)}</div>
                    </div>
                ) : null}
            </div>
            <div>
                <div className="ml-2">
                    <SectionDivider text="Up Next" count={queueNext.length}>
                        <div className="text-sm text-neutral-400">Auto-updates enabled</div>
                    </SectionDivider>
                    <div className="ml-4 text-neutral-400 text-sm tracking-tight">There are no downloads in the queue.</div>
                </div>


                {queueCompleted.length ? (
                    <div>
                        <SectionDivider text="Completed" count={queueCompleted.length}>
                            <button onClick={() => clearCompleted()} className="inline-block rounded border border-indigo-600 bg-indigo-600 px-6 py-2 text-sm font-medium text-white focus:outline-none focus:ring active:text-indigo-500">Clear All</button>
                        </SectionDivider>
                        <ul>
                            {queueCompleted.map((value, i) => (
                                <li key={i}>
                                    {value.type}
                                    {value.ammount}
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : null}
            </div>

        </div>
    );
}

export default DownloadsPage;