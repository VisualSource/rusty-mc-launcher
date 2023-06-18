import { useNavigate } from 'react-router-dom';
import type { ModrinthProject } from '@/lib/api/modrinth';
import { FaAppStore } from 'react-icons/fa';

const ModCard: React.FC<ModrinthProject> = ({ slug, title, icon_url, description, client_side, server_side, display_categories, versions, }) => {
    const navigate = useNavigate();
    return (
        <div onClick={() => navigate(`/mod/${slug}`)} className="flex transition hover:shadow-xl bg-gray-800 shadow-gray-800/25 cursor-pointer h-64">
            <div className="p-2 flex flex-col gap-2 text-lg">
                {display_categories.map((cat, i) => (
                    <span title={cat} key={i} className="hover:text-gray-50 shadow">
                        <FaAppStore />
                    </span>
                ))}
            </div>
            <div className="hidden sm:block sm:basis-56">
                <img className="aspect-square w-full object-contain object-center" src={icon_url} alt="Modrinth project icon" />
            </div>
            <div className='flex flex-1 flex-col justify-between'>
                <div className="border-s border-gray-900/10 p-4 sm:border-l-transparent sm:p-6">
                    <h3 className="font-bold uppercase text-white">{title}</h3>
                    <div className='flex flex-wrap gap-1 overflow-hidden h-6'>
                        {versions.toReversed().map((support, i) => (
                            <span className="whitespace-nowrap rounded-full bg-purple-100 px-2.5 py-0.5 text-xs text-purple-700" key={i}>{support}</span>
                        ))}
                    </div>
                    <p className="mt-2 text-sm/relaxed text-white line-clamp-4">{description}</p>
                </div>
                <div className="sm:flex sm:items-end sm:justify-end">
                    <button className="block bg-yellow-300 px-5 py-3 text-center text-xs font-bold uppercase text-gray-900 transition hover:bg-yellow-400">Install</button>
                </div>
            </div>
        </div>
    );
}

export default ModCard;