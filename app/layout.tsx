import BottomMenu from "@/components/bottomMenu";
import { EquiposProvider } from '@/app/context/EquiposContext'

import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sagrerenc",
  description: "Llistat partits hoquei Sagrerenc",
  themeColor: "#0ea5e9",
  icons: {
    icon: "/favicon.ico",
    apple: "/sagrerencicon-192.png",
    other: [
      { rel: "icon", url: "/sagrerencicon-192.png" },
      { rel: "icon", url: "/sagrerencicon-512.png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0ea5e9" />
      </head>
      <body className="pb-20">
        <EquiposProvider>{children}</EquiposProvider>
        <BottomMenu />
      </body>
    </html>
  );
}
