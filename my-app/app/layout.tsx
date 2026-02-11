import "./globals.css";
import { Inter } from "next/font/google";
import Image from "next/image";
import { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Transporter | Geleceğin Lojistik Ağı",
  description: "Kurtarıcı, nakliye ve mobil şarj hizmetlerine anında erişin. Transporter ile lojistik süreçleriniz güvende.",
  openGraph: {
    title: "Transporter | Geleceğin Lojistik Ağı",
    description: "Türkiye'nin en gelişmiş dijital lojistik pazaryeri.",
    url: "https://transporter.com",
    siteName: "Transporter AI",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Transporter Önizleme",
      },
    ],
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Transporter | Geleceğin Lojistik Ağı",
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
        
        {/* REFINED CRYSTAL SPLASH SCREEN */}
        <div 
          id="splash-screen" 
          className="fixed inset-0 z-[100000] bg-[#fdfdfd] flex flex-col items-center justify-center transition-all duration-1000 ease-in-out"
        >
          <div className="absolute top-[25%] right-[-5%] w-[400px] h-[400px] bg-cyan-400/10 rounded-full animate-crystal-glow pointer-events-none"></div>
          <div className="absolute bottom-[15%] left-[-5%] w-[350px] h-[350px] bg-teal-300/10 rounded-full animate-crystal-glow pointer-events-none" style={{ animationDelay: '2s' }}></div>

          <div className="relative animate-refined">
            <div className="relative w-40 h-40 glass-card-refined rounded-[3.5rem] flex items-center justify-center">
               <Image 
                 src="/favicon.ico" 
                 width={120} 
                 height={120} 
                 alt="Logo" 
                 priority 
                 className="drop-shadow-md"
               />
            </div>
          </div>
          
          <div className="mt-8 text-center space-y-3 relative z-10">
            <h1 className="text-slate-900 font-extrabold text-3xl uppercase italic tracking-tighter text-shadow-sm">
              Transporter
            </h1>
            <div className="bg-white/50 border border-white/80 backdrop-blur-md px-5 py-2 rounded-2xl shadow-sm inline-block">
               <p className="text-cyan-600 text-[10px] font-black uppercase tracking-[0.4em] leading-none">
                 Geleceğin Lojistik Ağı
               </p>
            </div>
          </div>

          <div className="absolute bottom-10 opacity-20">
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Transporter AI 2026</span>
          </div>
        </div>

        {children}

        {/* AKILLI SPLASH YÖNETİMİ (Class-Based) */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            const splash = document.getElementById('splash-screen');
            const path = window.location.pathname;
            const isNoSplashPage = path.includes('privacy') || path.includes('gizlilik') || path.includes('kvkk');

            // Hata Düzeltme: style.overflowY = "hidden" yerine classList kullanıyoruz.
            if (isNoSplashPage) {
              if (splash) splash.style.display = 'none';
              document.body.classList.remove('overflow-hidden');
            } else {
              document.body.classList.add('overflow-hidden');
              window.addEventListener('load', function() {
                setTimeout(function() {
                  if (splash) {
                    splash.style.opacity = '0';
                    splash.style.filter = 'blur(15px)';
                    splash.style.transform = 'scale(1.05)';
                    setTimeout(() => {
                      splash.remove();
                      document.body.classList.remove('overflow-hidden');
                    }, 1000);
                  }
                }, 1800);
              });
            }
          })();
        `}} />
      </body>
    </html>
  );
}