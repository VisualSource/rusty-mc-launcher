import type { ModList } from '@/data/mods';
import { ModrinthProject } from '@/lib/api/modrinth';
import { installModListFromDialog } from '@/lib/installModList';
import { useNavigate } from 'react-router-dom';

const ModListCard: React.FC<ModrinthProject> = ({ slug, title, icon_url, description, }) => {
    const navigate = useNavigate();
    return (
        <button onClick={() => navigate(`/mod/${slug}`)} className="flex transition hover:shadow-xl bg-gray-800 shadow-gray-800/25 cursor-pointer">
            <div className="hidden sm:block sm:basis-56">
                <img className="aspect-square h-full w-full object-cover" src={icon_url} alt="Monrinth project icon" />
            </div>
            <div className='flex flex-1 flex-col justify-between'>
                <div className="border-s border-gray-900/10 p-4 sm:border-l-transparent sm:p-6">
                    <h3 className="font-bold uppercase text-white text-left">{title}</h3>
                    <p className="mt-2 text-sm/relaxed text-white line-clamp-4 text-left">{description}</p>
                </div>
            </div>
        </button>
    );
}

export default ModListCard;