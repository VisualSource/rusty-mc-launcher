import { LoaderCircle } from "lucide-react";

export const Loading: React.FC = () => {
	return (
		<div className="p-2 h-full w-full flex justify-center items-center gap-2">
			<div className="inline-block animate-spin">
				<LoaderCircle className="text-foreground" />
			</div>
			<span>Loading...</span>
		</div>
	);
};
