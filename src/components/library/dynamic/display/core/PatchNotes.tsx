import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { compareDesc } from "date-fns/compareDesc";
import { AlertTriangle, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { memo, useState } from "react";
import rehypeRaw from "rehype-raw";

import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { Loading } from "@/components/Loading";
import { Button } from "@component/ui/button";
import { LazyLoadImage } from "react-lazy-load-image-component";

type Patch = {
	title: string;
	type: string;
	version: string;
	image: {
		url: string;
		title: string;
	};
	body: string;
	id: string;
};

type PatchNodes = {
	version: number;
	entries: {
		title: string;
		version: string;
		type: "snapshot" | "release";
		date: string;
		image: {
			url: string;
			title: string;
		};
		shortText: string;
		contentPath: string;
		id: string;
	}[];
};

const PatchNotesRead: React.FC<{
	contentPath?: string;
	open: boolean;
	setOpen: (value: boolean) => void;
}> = memo(({ contentPath, open, setOpen }) => {
	const query = useQuery({
		enabled: !!contentPath?.length,
		queryKey: ["MINECRAFT_PATCH_NODES", contentPath],
		queryFn: () =>
			fetch(`https://launchercontent.mojang.com/v2/${contentPath}`).then(
				(e) => e.json() as Promise<Patch>,
			),
	});
	return (
		<Drawer open={open} onOpenChange={setOpen}>
			<DrawerContent className="overflow-hidden max-h-screen">
				<DrawerHeader>
					<DrawerTitle>Patch Notes</DrawerTitle>
					<div className="flex justify-end">
						<DrawerClose asChild>
							<Button variant="outline">
								<X />
							</Button>
						</DrawerClose>
					</div>
				</DrawerHeader>
				<div className="w-full flex justify-center overflow-y-scroll scrollbar">
					<div className="max-h-full md:max-w-3xl xl:max-w-5xl prose prose-invert">
						{query.isError ? (
							<div className="p-2 text-2xl h-full w-full flex justify-center items-center">
								<div className="inline-block px-2">
									<AlertTriangle />
								</div>
								<h1>Failed to load patch notes</h1>
								<pre className="text-sm text-muted-foreground">
									<code>{query.error.message}</code>
								</pre>
							</div>
						) : query.isLoading ? (
							<Loading />
						) : (
							<>
								<h1>{query.data?.title}</h1>
								<ReactMarkdown
									components={{
										a: ({ children, href }) => (
											<a target="_blank" rel="noopener noreferrer" href={href}>
												{children}
											</a>
										),
									}}
									rehypePlugins={[rehypeRaw]}
								>
									{query.data?.body}
								</ReactMarkdown>
							</>
						)}
					</div>
				</div>
			</DrawerContent>
		</Drawer>
	);
});
PatchNotesRead.displayName = "PatchNotesRead";

export const PatchNotesSkeletons: React.FC = memo(() => {
	return (
		<>
			{Array.from({ length: 8 }).map((_, i) => (
				<div className="space-y-3 w-[150px]" key={`fav_profile_skel_${i + 1}`}>
					<div className="overflow-hidden rounded-md">
						<Skeleton className="rounded-lg w-[150px] h-[150px]" />
					</div>
					<div className="space-y-1 text-sm">
						<Skeleton className="h-5 w-20" />
						<Skeleton className="h-4 w-10" />
					</div>
				</div>
			))}
		</>
	);
});
PatchNotesSkeletons.displayName = "PatchNotesSkeletion";

const PatchNotes: React.FC = () => {
	const [openNotes, setOpenNotes] = useState(false);
	const [contentPath, setContentPath] = useState<string>();
	const { data, error } = useSuspenseQuery({
		queryKey: ["MINECRAFT", "PATCH_NOTES"],
		queryFn: () =>
			fetch("https://launchercontent.mojang.com/v2/javaPatchNotes.json")
				.then((value) => value.json() as Promise<PatchNodes>)
				.then((value) =>
					value.entries
						.toSorted((a, b) => compareDesc(a.date, b.date))
						.slice(0, 10),
				),
	});

	if (error) throw new Error("Failed to load patch notes");

	return (
		<>
			{data.map((value) => (
				<button
					type="button"
					onClick={() => {
						setContentPath(value.contentPath);
						setOpenNotes(true);
					}}
					className="space-y-3 w-[150px]"
					key={value.id}
				>
					<div className="overflow-hidden rounded-md">
						<LazyLoadImage
							height={150}
							width={150}
							effect="blur"
							className="h-auto w-auto object-cover transition-all! hover:scale-105 aspect-3/4"
							alt={value.image.title}
							wrapperProps={{
								style: { transitionDelay: "1s" },
							}}
							src={`https://launchercontent.mojang.com${value.image.url}`} />
					</div>
					<div className="space-y-1 text-sm text-left">
						<h3 className="font-medium leading-none">{value.title}</h3>
						<p className="text-xs text-muted-foreground">{value.type}</p>
					</div>
				</button>
			))}
			<PatchNotesRead
				open={openNotes}
				setOpen={setOpenNotes}
				contentPath={contentPath}
			/>
		</>
	);
};

export default PatchNotes;
