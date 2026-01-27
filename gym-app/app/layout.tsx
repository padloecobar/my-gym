import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./ui.css";
import AppShell from "./components/AppShell";
import { GymStoreProvider } from "../store/gym";

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
  themeColor: "#f7f8fb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <GymStoreProvider>
          <AppShell>{children}</AppShell>
        </GymStoreProvider>
      </body>
    </html>
  );
}
