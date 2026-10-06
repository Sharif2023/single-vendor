import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Store | Premium E-commerce",
  description: "A premium e-commerce experience",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans min-h-screen bg-background text-foreground flex flex-col antialiased selection:bg-black selection:text-white" suppressHydrationWarning>
        <Providers>{children}</Providers>
        <Toaster position="top-center" closeButton duration={3000} />
      </body>
    </html>
  );
}
