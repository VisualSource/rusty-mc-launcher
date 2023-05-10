import { useIsAuthenticated } from "@azure/msal-react";
import { HiSearch } from "react-icons/hi";
import { Link } from "react-router-dom";
import Unauthenticated from "@/components/Unauthenticated";
import { useProfiles } from "@/lib/hooks/useProfiles";
import LibraryCard from "@/components/LibraryCard";
import Spinner from "@/components/Spinner";

const Library = () => {
    const isAuthenticated = useIsAuthenticated();
    const { profiles, isLoading, isError, error } = useProfiles();

    if (!isAuthenticated) {
        return (
            <Unauthenticated />
        );
    }

    return (
        <div className="flex overflow-y-hidden flex-col h-full">
            <div className="py-1 px-2 flex gap-2">
                <div className="relative w-full">
                    <label htmlFor="SearchLib" className="sr-only">Email</label>

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
            <div className="p-4 flex flex-col flex-grow gap-4 overflow-y-scroll">
                {isError ? (<div className="flex flex-col flex-grow justify-center items-center">Failed to load profiles!</div>) : null}
                {isLoading ? (
                    <div className="w-full h-full flex-grow flex flex-col items-center justify-center">
                        <Spinner />
                    </div>
                ) : null}
                {profiles ? !profiles?.length ? (
                    <div className="flex flex-col flex-grow justify-center items-center">No Profiles </div>
                ) : (profiles ?? []).map((profile, i) => (
                    <LibraryCard key={i} profile={profile} />
                )) : null}
            </div>
        </div>
    );
}

export default Library;