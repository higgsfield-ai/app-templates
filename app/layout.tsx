import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { cn } from "@/lib/utils";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

// Replace with the product's own identity when adapting the scaffold.
export const metadata: Metadata = {
  title: "Studio",
  description: "Generate images and video with Higgsfield models.",
};

export const viewport: Viewport = { themeColor: "#0f0f10" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn("dark antialiased font-sans", inter.variable)}>
      <body className="min-h-svh bg-background text-foreground">{children}</body>
    </html>
  );
}
