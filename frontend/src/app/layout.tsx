import "./globals.css";
import "./ditto.css";
import type { ReactNode } from "react";
import { SITE_ORIGIN } from "../lib/site";
import { GridVignetteBackground } from "@/components/ui/vignette-grid-background";

export const metadata = {
  "metadataBase": new URL(SITE_ORIGIN || "http://localhost:3000"),
  "title": "Nyay Suraksha | Secure Case Network",
  "description": "Cryptographically verifiable document command center for India's justice ecosystem."
};
export const viewport = {
  "width": "device-width",
  "initialScale": 1,
  "themeColor": "#000000"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang={"en"}>
      <body className="min-h-full block text-foreground [font-family:'Plus_Jakarta_Sans',_sans-serif] text-base font-normal not-italic leading-6 tracking-[normal] [word-spacing:0px] text-start normal-case whitespace-normal [word-break:normal] [overflow-wrap:normal] indent-0 [text-shadow:none] [font-variant-caps:normal] [font-feature-settings:normal] list-outside [writing-mode:horizontal-tb] [direction:ltr] bg-background" data-cid="n0">
        <GridVignetteBackground
          size={40}
          x={50}
          y={50}
          intensity={60}
          horizontalVignetteSize={90}
          verticalVignetteSize={90}
        />
        {children}
      </body>
    </html>
  );
}
