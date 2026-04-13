import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FocusTrack",
  description: "Modern productivity SaaS for tasks, notes, focus sessions, and analytics.",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full bg-background text-text-primary">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
