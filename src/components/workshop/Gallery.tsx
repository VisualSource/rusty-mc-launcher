import { useState } from "react";
import {
	Carousel,
	type CarouselApi,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "../ui/carousel";
import type { Project } from "@/lib/api/modrinth/types.gen";
import { Separator } from "../ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Image } from "lucide-react";
import { LazyLoadImage } from "react-lazy-load-image-component";

export const Gallery: React.FC<{
	gallery: NonNullable<Project["gallery"]>;
}> = ({ gallery }) => {
	const [api, setApi] = useState<CarouselApi>();

	const images = gallery.toSorted(
		(a, b) => (b?.ordering ?? 0) - (a?.ordering ?? 0),
	);

	return (
		<Carousel setApi={setApi}>
			<CarouselContent>
				{images.map((item, i) => (
					<CarouselItem key={`carousel_item_${i + 1}`}>
						<div className="flex justify-center items-center h-80">
							<LazyLoadImage
								effect="blur"
								className="object-contain w-full h-full rounded-md"
								wrapperProps={{
									style: { transitionDelay: "1s" },
								}}
								src={item?.url}
								alt={item?.title ?? `Gallery Image ${i}`}
							/>
						</div>
					</CarouselItem>
				))}
			</CarouselContent>

			<Separator className="my-2" />

			<div className="relative flex items-center justify-between px-6">
				<CarouselPrevious className="relative bottom-0 left-0 right-0 top-0 translate-y-0" />

				<div className="flex gap-4 overflow-hidden">
					{images.slice(0, 6).map((item, i) => (
						<button
							type="button"
							key={`preview_image_${i + 1}`}
							onClick={() => api?.scrollTo(i)}
							className="h-20 w-32"
						>
							<Avatar className="rounded-md h-20 w-32">
								<AvatarFallback className="rounded-md">
									<Image />
								</AvatarFallback>
								<AvatarImage
									src={item?.url}
									alt={item?.title ?? `Gallery Image ${i}`}
								/>
							</Avatar>
						</button>
					))}
				</div>
				<CarouselNext className="relative bottom-0 left-0 right-0 top-0 translate-y-0" />
			</div>
			<Separator className="my-2" />
		</Carousel>
	);
};
