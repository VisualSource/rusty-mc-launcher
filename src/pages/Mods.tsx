import ModCard from "@/components/ModCard";
import { mods } from "@/data/mods";

const Mods: React.FC = () => {
    return (
        <main className="h-full px-4 overflow-y-scroll">
            <div className="grid grid-cols-2 gap-2 my-4">
                {Object.values(mods).map((mod, i) => (
                    <ModCard {...mod} key={i} />
                ))}
            </div>
        </main>
    );
}

export default Mods;