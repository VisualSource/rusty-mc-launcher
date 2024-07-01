import { Loader2 } from "lucide-react";

export const Loading: React.FC = () => {
	return (
		<div className="p-2 h-full w-full flex justify-center items-center @container">
			<div className="inline-block animate-spin px-2 transition opacity-1 duration-500 delay-300">
				<Loader2 />
			</div>
			<span className="@lg:text-2xl">Loading...</span>
		</div>
	);
};
