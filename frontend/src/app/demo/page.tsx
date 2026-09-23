import { GridVignetteBackground } from "@/components/ui/vignette-grid-background";
import { Button } from "@/components/ui/button";

export default function DemoOne() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <GridVignetteBackground
        className="opacity-80"
        x={50}
        y={50}
        intensity={100}
        horizontalVignetteSize={50}
        verticalVignetteSize={30}
      />
      <div className="flex items-center justify-center flex-col gap-5">
        <h1 className="text-center text-4xl md:text-6xl font-semibold">
          Start your free trial
        </h1>
        <p className="text-center text-lg md:text-xl text-muted-foreground">
          Join over 4,000+ users already using Molecule UI
        </p>
        <Button>
          <a href="https://moleculeui.design" target="_blank" rel="noreferrer">
            Get Started
          </a>
        </Button>
      </div>
    </div>
  );
}
