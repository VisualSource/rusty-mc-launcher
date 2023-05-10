import LibraryCard from "@/components/LibraryCard";
import Spinner from "@/components/Spinner";
import { useProfiles } from "@/lib/hooks/useProfiles";
import { HiSearch } from "react-icons/hi";
import { Link } from "react-router-dom";

const Library = () => {
    const { profiles, isLoading, isError, error } = useProfiles();

    return (
        <div className="flex flex-1 overflow-y-hidden flex-col">
            <div className="py-1 px-2 flex gap-2">
                <div className="relative w-full">
                    <label htmlFor="SearchLib" className="sr-only"> Email </label>

                    <input
                        type="text"
                        id="SearchLib"
                        placeholder="Search"
                        className="h-full w-full rounded-md pr-10 shadow-sm border-gray-700 bg-gray-800 text-white sm:text-sm"
                    />

                    <span className="pointer-events-none absolute inset-y-0 right-0 grid w-10 place-content-center text-gray-400">
                        <HiSearch />
                    </span>
                </div>
                <Link to="/profile/create" className="w-1/4 text-center inline-block rounded bg-green-500 hover:bg-green-600 px-8 py-3 text-sm font-medium text-white transition hover:shadow-xl focus:outline-none focus:ring active:bg-green-500">Create</Link>
            </div>
            <div className="p-4 flex flex-col gap-4 overflow-y-scroll">
                {isError ? (<div>Failed to load profiles!</div>) : null}
                {isLoading ? (
                    <div className="w-full h-full flex-grow flex flex-col items-center justify-center">
                        <Spinner />
                    </div>
                ) : null}
                {!profiles?.length ? (
                    <div> No Profiles </div>
                ) : (profiles ?? []).map((profile, i) => (
                    <LibraryCard key={i} profile={profile} />
                ))}
            </div>
        </div>
    );
}

export default Library;