'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { auth } from '../../lib/firebase';

const PUBLIC_PATHS = new Set(['/auth', '/privacy', '/support']);

export default function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const hasLocalSession = () =>
        Boolean(
          localStorage.getItem('Transport_auth_logged_in') ||
          localStorage.getItem('Transport_user_email') ||
          localStorage.getItem('Transport_user_phone') ||
          localStorage.getItem('Transport_user_name'),
        );

      const applyNativeUser = (user: any) => {
        const displayName = String(user?.displayName || '').trim();
        const email = String(user?.email || '').trim();
        const phone = String(user?.phoneNumber || '').trim();
        const fallbackName = email.includes('@') ? email.split('@')[0] : '';
        const resolvedName = displayName || fallbackName;
        localStorage.setItem('Transport_auth_logged_in', '1');
        if (resolvedName) localStorage.setItem('Transport_user_name', resolvedName);
        if (email) localStorage.setItem('Transport_user_email', email);
        if (phone) localStorage.setItem('Transport_user_phone', phone);
        setLoggedIn(true);
      };

      const hydrateNativeUser = async () => {
        try {
          // Android'de app arka planda kapanırsa bekleyen auth sonucunu önce al.
          await FirebaseAuthentication.getPendingAuthResult();
        } catch {
          // iOS'ta desteklenmediği veya pending sonuç olmadığı durumda sessiz geç.
        }
        return FirebaseAuthentication.getCurrentUser();
      };

      let authStateListener: { remove: () => Promise<void> } | null = null;

      hydrateNativeUser()
        .then((result) => {
          const user = result?.user;
          if (user) {
            applyNativeUser(user);
          } else {
            setLoggedIn(hasLocalSession());
          }
        })
        .catch(() => setLoggedIn(hasLocalSession()))
        .finally(() => setReady(true));

      FirebaseAuthentication.addListener('authStateChange', (event: any) => {
        if (event?.user) {
          applyNativeUser(event.user);
          setReady(true);
          return;
        }
        setLoggedIn(hasLocalSession());
        setReady(true);
      })
        .then((listener) => {
          authStateListener = listener;
        })
        .catch(() => {});

      return () => {
        if (authStateListener) {
          authStateListener.remove().catch(() => {});
        }
      };
    }

    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        const displayName = String(user.displayName || '').trim();
        const email = String(user.email || '').trim();
        const phone = String(user.phoneNumber || '').trim();
        const fallbackName = email.includes('@') ? email.split('@')[0] : '';
        const resolvedName = displayName || fallbackName;
        if (resolvedName) localStorage.setItem('Transport_user_name', resolvedName);
        if (email) localStorage.setItem('Transport_user_email', email);
        if (phone) localStorage.setItem('Transport_user_phone', phone);
      }
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
