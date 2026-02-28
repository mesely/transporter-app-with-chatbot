'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';

const PUBLIC_PATHS = new Set(['/auth', '/privacy', '/support']);

export default function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setLoggedIn(!!user);
      setReady(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const currentPath = pathname || '/';
    if (!loggedIn && !PUBLIC_PATHS.has(currentPath)) {
      router.replace('/auth');
      return;
    }
    if (loggedIn && currentPath === '/auth') {
      router.replace('/');
    }
  }, [loggedIn, pathname, ready, router]);

  if (!ready) {
    return (
      <div className="min-h-screen w-full bg-[radial-gradient(circle_at_20%_20%,rgba(6,182,212,0.16),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(37,99,235,0.16),transparent_40%),#f8fafc] flex items-center justify-center">
        <div className="rounded-3xl bg-white/90 border border-slate-200 px-8 py-6 shadow-xl text-center">
          <img src="/playstore.png" alt="Transport 245" className="w-14 h-14 mx-auto mb-3 rounded-xl" />
          <p className="text-sm font-black uppercase tracking-wide text-slate-700">Yukleniyor...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

