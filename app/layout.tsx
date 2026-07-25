import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tusalon.github.io/RomaCrece/"),
  title: "RomaCrece — Analiza. Planifica. Crece.",
  description:
    "Audita tu Instagram, genera ideas y convierte contenido en clientes y reservas.",
  openGraph: {
    title: "RomaCrece — Tu asesora para crecer en Instagram",
    description: "Analiza, planifica y convierte tu contenido en oportunidades reales de crecimiento.",
    url: "https://tusalon.github.io/RomaCrece/",
    siteName: "RomaCrece",
    locale: "es_ES",
    type: "website",
    images: [{ url: "https://tusalon.github.io/RomaCrece/og.png", width: 1693, height: 929, alt: "RomaCrece, tu asesora para crecer en Instagram" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "RomaCrece — Tu asesora para crecer en Instagram",
    description: "Analiza · Planifica · Crece",
    images: ["https://tusalon.github.io/RomaCrece/og.png"],
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    shortcut: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
