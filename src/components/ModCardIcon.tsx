import { FaGithub, FaDiscord, FaGlobe, FaPatreon, FaTwitter, FaInfoCircle } from 'react-icons/fa';
import type { IconTypes } from '@/data/mods';

type Props = { links: { type: IconTypes, href: string; }[] }

const icons = {
    "github": { title: "Github", icon: FaGithub },
    "discord": { title: "Discord", icon: FaDiscord },
    "modrinth": { title: "Modrinth", icon: FaInfoCircle },
    "website": { title: "Website", icon: FaGlobe },
    "patreon": { title: "Patreon", icon: FaPatreon },
    "twitter": { title: "Twitter", icon: FaTwitter }
}


const IconLinks: React.FC<Props> = ({ links }) => {
    return (
        <>
            {links.map((link, i) => {
                const Icon = icons[link.type].icon;
                return (
                    <a className="hover:text-gray-50 shadow" title={icons[link.type].title} key={i} href={link.href} target="_blank">
                        <Icon />
                    </a>
                )
            })}
        </>
    );
}

export default IconLinks;