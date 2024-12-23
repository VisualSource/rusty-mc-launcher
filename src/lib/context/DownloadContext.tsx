import AskDialog from "@/components/dialog/AskDialog";

export const DownloadProvider = ({ children }: React.PropsWithChildren) => {
	return (
		<>
			{children}
			<AskDialog />
		</>
	);
};
