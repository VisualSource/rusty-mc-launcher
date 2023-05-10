import { useQuery } from '@tanstack/react-query';
import { getName, getTauriVersion, getVersion } from '@tauri-apps/api/app';

const Settings = () => {
    const { data } = useQuery(["app-data"], async () => {
        const [name, tauri, version] = await Promise.all([getName(), getTauriVersion(), getVersion()]);
        return {
            name,
            tauri,
            version
        }
    });

    return (
        <div className="h-full">
            <div className='flex flex-col items-center justify-center h-full'>
                <div><span className="font-bold">{data?.name}</span>: <span>{data?.version}</span></div>
                <div><span className="font-bold">Tauri</span>: <span>{data?.tauri}</span></div>
            </div>
        </div>
    );
}

export default Settings;