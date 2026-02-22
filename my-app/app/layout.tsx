import "./globals.css";
import { Inter } from "next/font/google";
import { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Transport 245 | Geleceğin Lojistik Ağı",
  description: "Kurtarıcı, nakliye ve mobil şarj hizmetlerine anında erişin. Transport 245 ile lojistik süreçleriniz güvende.",
  openGraph: {
    title: "Transport 245 | Geleceğin Lojistik Ağı",
    description: "Türkiye'nin en gelişmiş dijital lojistik pazaryeri.",
    url: "https://Transport 245.com",
    siteName: "Transport 245 AI",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Transport 245 Önizleme",
      },
    ],
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Transport 245 | Geleceğin Lojistik Ağı",
    description: "Anlık lojistik çözümler ve güvenilir ağ.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    /* suppressHydrationWarning: Tarayıcı eklentilerinin veya ufak DOM farklarının hata vermesini engeller */
    <html lang="tr" className="h-full" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body 
        className={`${inter.className} h-full bg-[#fdfdfd] antialiased`}
        suppressHydrationWarning
      >

        {children}
      </body>
    </html>
  );
}
