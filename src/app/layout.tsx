import { MotionConfig } from "motion/react";
import type { Metadata, Viewport } from "next";
import { Archivo, Big_Shoulders, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// "Big Shoulders" is the current variable family (the old "Display" cut is its
// optical-size axis; browsers pick it automatically at headline sizes).
const display = Big_Shoulders({
  subsets: ["latin", "latin-ext"],
  axes: ["opsz"],
  variable: "--font-big-shoulders",
  display: "swap",
  fallback: ["Big Shoulders Display", "Impact", "Arial Narrow", "sans-serif"],
  adjustFontFallback: false,
});

const body = Archivo({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BEVMard",
  description:
    "Featuring BEVMard, BEVMAQ's Artificial Recommendation Dispatcher. Tell him what you need, in your language, even the vague version.",
  metadataBase: new URL("https://bmi.bevmaq.com"),
  openGraph: {
    title: "BEVMard",
    description: "Tell him what you need. In your language. Even the vague version.",
    siteName: "BMi · BEVMAQ",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#070a12",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </body>
    </html>
  );
}
