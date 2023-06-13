import type { ModList } from '@/data/mods';
import { installModListFromDialog } from '@/lib/installModList';

const ModListCard: React.FC<ModList> = ({ id, name, icon, description, }) => {
    return (
        <div className="flex transition hover:shadow-xl bg-gray-800 shadow-gray-800/25 cursor-pointer">
            <div className="hidden sm:block sm:basis-56">
                <img className="aspect-square h-full w-full object-cover" src={icon.src} alt={icon.alt} />
            </div>
            <div className='flex flex-1 flex-col justify-between'>
                <div className="border-s border-gray-900/10 p-4 sm:border-l-transparent sm:p-6">
                    <h3 className="font-bold uppercase text-white">{name}</h3>
                    <p className="mt-2 text-sm/relaxed text-white line-clamp-4">{description}</p>
                </div>
                <div className="sm:flex sm:items-end sm:justify-end">
                    <button onClick={() => installModListFromDialog(id)} className="block bg-yellow-300 px-5 py-3 text-center text-xs font-bold uppercase text-gray-900 transition hover:bg-yellow-400">Install</button>
                </div>
            </div>
        </div>
    );
}

export default ModListCard;