import { FaGithub, FaDiscord, FaGlobe, FaPatreon, FaTwitter, FaInfoCircle, FaArrowUp, FaCode, FaWikipediaW, FaPaypal } from 'react-icons/fa';

const icons = {
    "issues": { title: "Issues", icon: FaArrowUp },
    "source": { title: "Source", icon: FaCode },
    "wiki": { title: "Wiki", icon: FaWikipediaW },
    "github": { title: "Github", icon: FaGithub },
    "discord": { title: "Discord", icon: FaDiscord },
    "modrinth": { title: "Modrinth", icon: FaInfoCircle },
    "website": { title: "Website", icon: FaGlobe },
    "Patreon": { title: "Patreon", icon: FaPatreon },
    "twitter": { title: "Twitter", icon: FaTwitter },
    "Ko-fi": { title: "Ko-fi", icon: FaInfoCircle },
    "GitHub Sponsors": { title: "GitHub Sponsors", icon: FaGithub },
    "PayPal": { title: "PayPal", icon: FaPaypal }
}
type Props = { links: { type: keyof typeof icons, href: string | null; }[] }

const IconLinks: React.FC<Props> = ({ links }) => {
    return (
        <>
            {links.filter((item) => !!item.href).map((link, i) => {
                const Icon = icons[link.type]?.icon;

                if (!Icon) throw new Error(`Missing icon for (${link.type})`);

                return (
                    <a className="hover:text-gray-50 shadow" title={icons[link.type].title} key={i} href={link.href!} target="_blank">
                        <Icon />
                    </a>
                )
            })}
        </>
    );
}

export default IconLinks;