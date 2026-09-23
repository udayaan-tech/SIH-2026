import { cn } from "@/lib/utils";

interface GridVignetteBackgroundProps {
  size?: number;
  x?: number;
  y?: number;
  horizontalVignetteSize?: number;
  verticalVignetteSize?: number;
  /**
   * 0 = fully vignetted (grid invisible at edges and centre),
   * 100 = no vignette (grid fully visible everywhere).
   * The radial mask grows from the centre outward; at intensity=100
   * the whole surface is opaque.
   */
  intensity?: number;
}

export function GridVignetteBackground({
  className,
  size = 48,
  x = 50,
  y = 50,
  horizontalVignetteSize = 100,
  verticalVignetteSize = 100,
  intensity = 0,
}: React.ComponentProps<"div"> & GridVignetteBackgroundProps) {
  // intensity 100 → mask covers everything (black 100%) → grid fully visible
  // intensity 0   → mask covers nothing  (black 0%)   → grid fully hidden
  const mask = `radial-gradient(ellipse ${horizontalVignetteSize}% ${verticalVignetteSize}% at ${x}% ${y}%, black ${intensity}%, transparent 100%)`;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[-1] opacity-50 pointer-events-none",
        className
      )}
      style={{
        backgroundImage:
          "linear-gradient(to right, var(--muted-foreground) 1px, transparent 1px), linear-gradient(to bottom, var(--muted-foreground) 1px, transparent 1px)",
        backgroundSize: `${size}px ${size}px`,
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
    />
  );
}
