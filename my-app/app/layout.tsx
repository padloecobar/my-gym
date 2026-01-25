import type { Metadata, Viewport } from "next";
import { Azeret_Mono, Recursive, Unbounded } from "next/font/google";
import "./globals.css";
import PwaRegister from "../components/PwaRegister";

const displayFont = Unbounded({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const bodyFont = Recursive({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

const monoFont = Azeret_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-code",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gym Log",
  description: "Low-tap gym logging with barbell math built in.",
  applicationName: "Gym Log",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-192.svg",
  },
  appleWebApp: {
    capable: true,
    title: "Gym Log",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f1e8" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1110" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`}
    >
      <body className="min-h-screen font-sans antialiased">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
