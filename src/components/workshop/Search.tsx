import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import { Input } from "../ui/input";

const Search = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState<string>("");
    const [query] = useDebounce(search, 500);

    useEffect(() => {
        if (query.length > 3) {
            navigate(`/workshop/search?query=${encodeURIComponent(query)}`);
        }
    }, [navigate, query]);

    return (
        <section className="flex justify-center shadow-xl">
            <div className="w-1/2 p-2">
                <Input value={search} onChange={(ev) => setSearch(ev.target.value)} placeholder="Search" />
            </div>
        </section>
    );
}

export default Search;