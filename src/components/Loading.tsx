import { Loader2 } from "lucide-react";

export const Loading: React.FC = () => {
	return (
		<div className="p-2 text-2xl h-full w-full flex justify-center items-center">
			<div className="inline-block animate-spin px-2 transition opacity-1 duration-500 delay-300">
				<Loader2 />
			</div>
			<span>Loading...</span>
		</div>
	);
};
