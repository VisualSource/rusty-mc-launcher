import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Settings2 } from "lucide-react";
import { Suspense } from "react";

import { type Card, DEFAULT_LAYOUT, OPTIONS, STORAGE_KEY } from "./EditConsts";
import { Button } from "@/components/ui/button";

const ComponentError = (props: FallbackProps) => {
	return <div>Error: {props.error?.message ?? props.error ?? "Unknown"}</div>;
};

export const DisplayContainer: React.FC<{
	setEditMode: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ setEditMode }) => {
	const { data } = useSuspenseQuery({
		queryKey: ["HOME_LAYOUT"],
		queryFn: () => {
			const data = localStorage.getItem(STORAGE_KEY);
			if (!data) {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_LAYOUT));
				return DEFAULT_LAYOUT;
			}
			try {
				return JSON.parse(data) as Card[];
			} catch (error) {
				console.error(error);
				return DEFAULT_LAYOUT;
			}
		},
	});

	return (
		<div className="relative">
			<Button
				onClick={() => setEditMode((e) => !e)}
				title="Edit"
				size="sm"
				variant="ghost"
				className="z-50 fixed right-4"
			>
				<Settings2 />
			</Button>

			{data.map((e) => {
				const Content = OPTIONS[e.type].Content;
				return (
					<ErrorBoundary fallbackRender={ComponentError} key={e.id}>
						<Suspense>
							<Content params={e.params as Record<string, string>} />
						</Suspense>
					</ErrorBoundary>
				);
			})}
		</div>
	);
};
