import { useRef, useEffect, useState } from 'react';
import { Controller, useForm } from "react-hook-form";
import SingleSelectBox from '../SingleSelectBox';

const CustomSelectItem: React.FC<{ value: string, selected: boolean }> = ({ value, selected }) => {
    return (
        <span
            className={`block truncate ${selected ? 'font-medium' : 'font-normal'
                }`}
        >
            {(value ?? "").replace(/^\w/, c => c.toUpperCase())}
        </span>)
}

const VersionSelector: React.FC = () => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [gameVersions, setGameVersions] = useState<string[]>([]);
    const [loaderVersions, setLoaderVerions] = useState<string[]>([]);

    const { handleSubmit, control, setValue } = useForm<{ loader: string; game: string; }>();

    useEffect(() => {
        const open = (ev: Event) => {
            const data = (ev as CustomEvent<{ games: string[]; loaders: string[] }>);
            setGameVersions(data.detail.games);
            setLoaderVerions(data.detail.loaders);
            setValue("loader", data.detail.loaders[0]);
            setValue("game", data.detail.games[0]);

            dialogRef.current?.showModal();
        }

        if (dialogRef.current) {
            dialogRef.current.addEventListener("close", () => {
                document.dispatchEvent(new CustomEvent("mcl::done::version-select", { detail: null }));
            });
        }

        document.addEventListener("mcl::open::version-select", open);

        return () => {
            document.removeEventListener("mcl::open::version-select", open);
        }
    }, []);

    const onSubmit = (ev: { game: string; loader: string; }) => {
        dialogRef.current?.close();
        document.dispatchEvent(new CustomEvent("mcl::done::version-select", {
            detail: {
                loader: ev.loader,
                game: ev.game
            }
        }));
    }

    return (
        <dialog ref={dialogRef} className="w-6/12 h-96 bg-gray-800 p-0 overflow-hidden backdrop:bg-gray-950 backdrop-blur-xl backdrop:bg-opacity-50">
            <div className="border-b font-bold p-2">
                <h1>Select Version and Mod Loader</h1>
            </div>
            <form className="p-2" method="dialog" onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-4">
                    <label>Mod Loader</label>
                    <Controller control={control} name="loader" rules={{ required: true }} render={({ field, fieldState }) => (
                        <>
                            <SingleSelectBox CustomElement={CustomSelectItem} values={loaderVersions} value={field.value} onChange={field.onChange} />
                            {fieldState.error ? (<span className="text-red-500">{fieldState.error.message}</span>) : null}
                        </>
                    )} />
                </div>
                <div className="mb-4">
                    <label>Minecraft</label>
                    <Controller control={control} name="game" rules={{ required: true }} render={({ field, fieldState }) => (
                        <>
                            <SingleSelectBox CustomElement={CustomSelectItem} values={gameVersions} value={field.value} onChange={field.onChange} />
                            {fieldState.error ? (<span className="text-red-500">{fieldState.error.message}</span>) : null}
                        </>
                    )} />
                </div>
                <div className='flex justify-between'>
                    <button className="block bg-red-500 px-5 py-3 text-center text-xs font-bold uppercase text-white transition hover:bg-red-400" onClick={() => dialogRef.current?.close("null")} type="button">Cancel</button>
                    <button className="block bg-green-400 px-5 py-3 text-center text-xs font-bold uppercase text-white transition hover:bg-green-500" type="submit">Ok</button>
                </div>
            </form>
        </dialog>
    );
}

export default VersionSelector;