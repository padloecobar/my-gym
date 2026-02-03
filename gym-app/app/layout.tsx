import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./ui.css";
import "./motion.css";
import AppShell from "./shared/components/AppShell";
import AppStoreProvider from "../store/AppStoreProvider";

export const metadata: Metadata = {
  title: "Gym Runner",
  description: "Offline-first workout runner for strength training.",
  manifest: "/manifest.webmanifest",
  applicationName: "Gym Runner",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Gym Runner",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff4e8" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f1a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppStoreProvider>
          <AppShell>{children}</AppShell>
        </AppStoreProvider>
      </body>
    </html>
  );
}
