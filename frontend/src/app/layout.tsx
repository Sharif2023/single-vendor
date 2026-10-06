import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Poppins } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import StorefrontLayout from "@/components/StorefrontLayout";
import { Toaster } from "@/components/ui/sonner";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Store | Premium E-commerce",
  description: "A premium modern e-commerce experience",
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
    <html
      lang="en"
      className={`${jakarta.variable} ${poppins.variable}`}
      suppressHydrationWarning
    >
      <body
        className="font-sans min-h-screen bg-background text-foreground flex flex-col antialiased selection:bg-[#D6FD04] selection:text-black"
        suppressHydrationWarning
      >
        <Providers>
          <StorefrontLayout>{children}</StorefrontLayout>
        </Providers>
        <Toaster position="top-center" closeButton duration={3000} />
      </body>
    </html>
  );
}
