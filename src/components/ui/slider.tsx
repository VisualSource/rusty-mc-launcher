import { Root, Track, Range, Thumb } from "@radix-ui/react-slider"
import { forwardRef } from "react"
import { cn } from "@/lib/utils"

export const MarkedSlider = forwardRef<
  React.ElementRef<typeof Root>,
  React.ComponentPropsWithoutRef<typeof Root>
>(({ className, ...props }, ref) => {
  return (
    <Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      {...props}
    >
      <Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
        <Range className="absolute h-full bg-primary" />
      </Track>
      <Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
        <div className="absolute left-1/2 top-7 h-4 w-fit -translate-x-1/2 text-center text-xs">
          {props.value?.[0] ?? 0}
        </div>
      </Thumb>
    </Root>
  )
});
MarkedSlider.displayName = Root.displayName

export const Slider = forwardRef<
  React.ElementRef<typeof Root>,
  React.ComponentPropsWithoutRef<typeof Root>
>(({ className, ...props }, ref) => (
  <Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
      <Range className="absolute h-full bg-primary" />
    </Track>
    <Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
  </Root>
))
Slider.displayName = Root.displayName


