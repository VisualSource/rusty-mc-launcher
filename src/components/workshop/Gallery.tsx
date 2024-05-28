import { useState } from "react";
import { Carousel, CarouselApi, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "../ui/carousel";
import type { Project } from "@/lib/api/modrinth/types.gen";
import { Separator } from "../ui/separator";

export const Gallery: React.FC<{ gallery: NonNullable<Project["gallery"]> }> = ({
    gallery,
}) => {
    const [api, setApi] = useState<CarouselApi>();

    const images = gallery.toSorted(
        (a, b) => (b?.ordering ?? 0) - (a?.ordering ?? 0),
    );

    return (
        <Carousel setApi={setApi}>
            <CarouselContent>
                {images.map((item, i) => (
                    <CarouselItem key={i}>
                        <div className="h-96">
                            <img
                                className="h-full w-full object-contain object-center"
                                src={item?.url}
                                alt={item?.title ?? `Gallery Image ${i}`}
                            />
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>

            <Separator className="my-4" />

            <div className="relative flex items-center justify-between px-6">
                <CarouselPrevious className="relative bottom-0 left-0 right-0 top-0 translate-y-0" />

                <div className="flex gap-4 overflow-hidden">
                    {images.slice(0, 6).map((item, i) => (
                        <button key={i} onClick={() => api?.scrollTo(i)} className="h-28 w-28">
                            <img
                                className="h-full w-full object-contain object-center"
                                src={item?.url}
                                alt={item?.title ?? `Gallery Image ${i}`}
                            />
                        </button>
                    ))}
                </div>
                <CarouselNext className="relative bottom-0 left-0 right-0 top-0 translate-y-0" />
            </div>
            <Separator className="my-4" />
        </Carousel>
    );
};