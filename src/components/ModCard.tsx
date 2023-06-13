import { useNavigate } from 'react-router-dom';
import type { IconTypes } from '@/data/mods';
import IconLinks from './ModCardIcon';

type Props = {
    id: string;
    name: string;
    description: string;
    supports: string[]
    img: {
        src: string;
        alt: string;
    }
    links: { type: IconTypes, href: string; }[]
}

const ModCard: React.FC<Props> = ({ id, name, description, img, links, supports = [] }) => {
    const navigate = useNavigate();
    return (
        <div onClick={() => navigate(`/mod/${id}`)} className="flex transition hover:shadow-xl bg-gray-800 shadow-gray-800/25 cursor-pointer">
            <div className="p-2 flex flex-col gap-2 text-lg">
                <IconLinks links={links} />
            </div>
            <div className="hidden sm:block sm:basis-56">
                <img className="aspect-square h-full w-full object-cover" src={img.src} alt={img.alt} />
            </div>
            <div className='flex flex-1 flex-col justify-between'>
                <div className="border-s border-gray-900/10 p-4 sm:border-l-transparent sm:p-6">
                    <h3 className="font-bold uppercase text-white">{name}</h3>
                    <div className='flex flex-wrap gap-1'>
                        {supports.map((support, i) => (
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