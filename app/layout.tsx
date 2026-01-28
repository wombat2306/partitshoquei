import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Partidos App",
  description: "Listado de partidos con Supabase, Tailwind y PWA",
  themeColor: "#0ea5e9",
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192.png",
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
      <body>{children}</body>
    </html>
  );
}
