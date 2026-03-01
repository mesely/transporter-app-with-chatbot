'use client';

import { useEffect, useState } from 'react';
import { getRedirectResult, signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import Image from 'next/image';
import { auth, appleProvider, googleProvider } from '../../lib/firebase';

function GoogleLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 533.5 544.3" aria-hidden="true">
      <path fill="#4285f4" d="M533.5 278.4c0-18.5-1.5-37-4.7-55.1H272v104.4h147.2c-6.1 33.2-25 61.3-53.1 80.1v66h85.9c50.3-46.3 81.5-114.6 81.5-195.4z" />
      <path fill="#34a853" d="M272 544.3c73.5 0 135.3-24.4 180.4-66.5l-85.9-66c-23.9 16.3-54.5 25.6-94.5 25.6-72.7 0-134.4-49.1-156.4-115.2h-88.6v72.4C72.3 484 166.6 544.3 272 544.3z" />
      <path fill="#fbbc04" d="M115.6 322.2c-10.9-32.4-10.9-67.6 0-100l-.1-72.4H27c-39.1 77.8-39.1 166.9 0 244.7l88.6-72.3z" />
      <path fill="#ea4335" d="M272 107c41.4-.6 81.1 14.9 111.6 43.6l83.2-83.2C402.6 24.2 339.4-.4 272 0 166.6 0 72.3 60.3 27 149.8l88.6 72.4C137.6 156.1 199.3 107 272 107z" />
    </svg>
  );
}

function AppleLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M16.365 1.43c0 1.14-.465 2.206-1.24 2.964-.79.78-2.01 1.28-3.127 1.192-.14-1.078.41-2.226 1.16-2.965.83-.82 2.15-1.405 3.207-1.19zM20.5 17.06c-.52 1.2-.76 1.73-1.43 2.76-.94 1.43-2.26 3.2-3.9 3.22-1.46.02-1.84-.95-3.82-.94-1.98.01-2.4.96-3.86.95-1.64-.03-2.9-1.62-3.84-3.05-2.62-3.98-2.9-8.65-1.28-11.14 1.15-1.78 2.98-2.83 4.7-2.83 1.75 0 2.85.96 4.3.96 1.4 0 2.26-.96 4.29-.96 1.53 0 3.15.83 4.3 2.26-3.77 2.06-3.15 7.52.54 8.77z" />
    </svg>
  );
}

function mapAuthErrorMessage(err: any) {
  const code = String(err?.code || '');
  const message = String(err?.message || '');
  if (code.includes('popup-closed-by-user')) return 'Giriş penceresi kapatıldı. Tekrar deneyin.';
  if (code.includes('popup-blocked')) return 'Tarayıcı popup engelledi. Popup izni verip tekrar deneyin.';
  if (code.includes('cancelled-popup-request')) return 'Açık giriş penceresi kapatıldı. Tekrar deneyin.';
  if (code.includes('unauthorized-domain')) return 'Bu domain Firebase yetkili domain listesinde değil.';
  if (code.includes('account-exists-with-different-credential')) return 'Bu hesap farklı giriş yöntemiyle kayıtlı.';
  if (code.includes('network-request-failed')) return 'Ağ hatası oluştu. İnternet bağlantısını kontrol edin.';
  if (code.includes('web-storage-unsupported')) return 'Tarayıcı depolama (local/session) kapalı görünüyor.';
  if (code.includes('missing-or-invalid-nonce')) return 'Apple güvenlik doğrulaması başarısız oldu (nonce).';
  if (code.includes('credential-already-in-use')) return 'Bu Apple hesabı başka bir kullanıcıya bağlı.';
  if (code.includes('invalid-credential')) return 'Sağlayıcıdan dönen oturum bilgisi geçersiz.';
  if (code.includes('operation-not-supported-in-this-environment')) return 'Bu giriş yöntemi bu ortamda desteklenmiyor.';
  if (code.includes('argument-error')) return 'Eksik/yanlış giriş parametresi.';
  if (code.includes('invalid-oauth-client-id')) return 'OAuth Client ID hatalı.';
  if (code.includes('too-many-requests')) return 'Çok fazla deneme yapıldı. Biraz sonra tekrar deneyin.';
  if (code.includes('canceled')) return 'Giriş işlemi iptal edildi.';
  if (code.includes('not-supported')) return 'Bu cihaz/işletim sistemi bu giriş yöntemini desteklemiyor.';
  if (code.includes('missing-client-identifier')) return 'Apple için client identifier eksik.';
  if (message.toLocaleLowerCase('tr').includes("doesn't support credential manager")) {
    return 'Bu cihaz Credential Manager desteklemiyor. Google giriş için klasik hesap seçimi kullanılacak.';
  }
  if (message.toLocaleLowerCase('tr').includes('credential manager')) {
    return 'Credential Manager bu cihazda kullanılamadı. Tekrar deneyin.';
  }
  if (code.includes('no-credentials') || message.toLocaleLowerCase('tr').includes('no credentials available')) {
    return 'Bu cihazda uygun Google hesabı bulunamadı. Hesap ekleyip tekrar deneyin.';
  }
  if (
    code.includes('10') ||
    message.includes('10:') ||
    message.toLocaleLowerCase('tr').includes('developer_error')
  ) {
    return 'Google giriş yapılandırma hatası (kod 10). Firebase Android uygulamasına SHA-1/SHA-256 ekleyip google-services.json dosyasını tekrar indirmeniz gerekiyor.';
  }
  if (message.toLocaleLowerCase('tr').includes('apple')) {
    return 'Apple giriş yapılandırması eksik/hatalı olabilir. Apple Developer ve Firebase ayarlarını kontrol edin.';
  }
  if (message.toLocaleLowerCase('tr').includes('simulator')) {
    return 'iOS simülatörde native kimlik doğrulama sınırlı olabilir. Gerçek cihazda deneyin.';
  }
  if (code.includes('internal-error')) return 'Native auth hatası. Firebase yapılandırması (google-services.json / GoogleService-Info.plist, SHA ve OAuth istemcisi) eksik olabilir.';
  if (code.includes('operation-not-allowed')) return 'Sağlayıcı Firebase’de kapalı. Firebase Console > Authentication > Sign-in method bölümünden Google ve Apple sağlayıcılarını açın.';
  return err?.message || 'Kimlik doğrulama başarısız.';
}

function persistLocalUser(user: any) {
  const email = String(user?.email || '').trim();
  const displayName = String(user?.displayName || '').trim();
  const phoneNumber = String(user?.phoneNumber || '').trim();
  const fallbackName = email.includes('@') ? email.split('@')[0] : '';

  localStorage.removeItem('Transport_guest_mode');
  localStorage.setItem('Transport_auth_logged_in', '1');
  if (displayName || fallbackName) localStorage.setItem('Transport_user_name', displayName || fallbackName);
  if (email) localStorage.setItem('Transport_user_email', email);
  if (phoneNumber) localStorage.setItem('Transport_user_phone', phoneNumber);
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs = 15000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error('AUTH_TIMEOUT')), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export default function AuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logoSrc, setLogoSrc] = useState('/favicon.ico');
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();
  const isIosSimulator =
    isNative &&
    platform === 'ios' &&
    /simulator|x86_64|i386/i.test(
      (typeof navigator !== 'undefined' ? navigator.userAgent : '') +
        ' ' +
        (typeof navigator !== 'undefined' ? navigator.platform : ''),
    );
  const showAppleButton = !isNative || platform === 'ios';

  const continueAsGuest = () => {
    setError('');
    setLoading(false);
    localStorage.setItem('Transport_guest_mode', '1');
    localStorage.setItem('Transport_auth_logged_in', '1');
    localStorage.removeItem('Transport_user_email');
    localStorage.removeItem('Transport_user_phone');
    localStorage.removeItem('Transport_user_name');
    router.replace('/');
  };

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      setLoading(false);
      return;
    }

    let active = true;
    getRedirectResult(auth)
      .then((result) => {
        if (!active) return;
        if (result?.user) {
          persistLocalUser(result.user);
          router.replace('/');
          return;
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        const code = String(err?.code || '');
        if (code.includes('argument-error') || code.includes('no-auth-event')) {
          setLoading(false);
          return;
        }
        setError(mapAuthErrorMessage(err));
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [router]);

  const socialLogin = async (provider: 'google' | 'apple') => {
    if (loading) return;
    setError('');
    setLoading(true);
    const failSafeTimer = setTimeout(() => setLoading(false), 25000);
    try {
      if (provider === 'apple' && isNative && platform !== 'ios') {
        throw new Error('Apple ile giriş sadece iOS cihazlarda kullanılabilir.');
      }
      if (isIosSimulator) {
        throw new Error('iOS simülatörde sosyal giriş çalışmayabilir. Lütfen gerçek iPhone cihazda deneyin.');
      }

      if (Capacitor.isNativePlatform() && !isIosSimulator) {
        if (provider === 'google') {
          let nativeResult: any;
          try {
            if (platform === 'android') {
              nativeResult = await withTimeout(
                FirebaseAuthentication.signInWithGoogle({ useCredentialManager: false }),
                20000,
              );
            } else {
              nativeResult = await withTimeout(FirebaseAuthentication.signInWithGoogle(), 20000);
            }
          } catch (firstErr: any) {
            const firstMessage = String(firstErr?.message || '').toLocaleLowerCase('tr');
            if (
              firstMessage.includes('no credentials available') ||
              firstMessage.includes("doesn't support credential manager") ||
              firstMessage.includes('credential manager')
            ) {
              nativeResult = await withTimeout(
                FirebaseAuthentication.signInWithGoogle({ useCredentialManager: false }),
                20000,
              );
            } else {
              throw firstErr;
            }
          }

          if (nativeResult?.user) {
            persistLocalUser(nativeResult.user);
            router.replace('/');
            return;
          }
          throw new Error('Google giriş tamamlanamadı.');
        }

        const nativeAuth: any = FirebaseAuthentication;
        if (typeof nativeAuth?.signInWithApple !== 'function') {
          throw new Error('Bu sürümde Apple giriş native olarak desteklenmiyor.');
        }
        const appleResult = await withTimeout(nativeAuth.signInWithApple(), 20000);
        const appleUser = appleResult?.user;
        if (appleUser) {
          persistLocalUser(appleUser);
          router.replace('/');
          return;
        }
        throw new Error('Apple giriş tamamlanamadı.');
      }

      const selectedProvider = provider === 'google' ? googleProvider : appleProvider;
      if (provider === 'google') {
        googleProvider.setCustomParameters({ prompt: 'select_account' });
      } else {
        appleProvider.setCustomParameters({ locale: 'tr' });
      }
      const cred = await signInWithPopup(auth, selectedProvider);
      if (cred?.user) {
        persistLocalUser(cred.user);
        router.replace('/');
        return;
      }
      throw new Error(provider === 'google' ? 'Google giriş tamamlanamadı.' : 'Apple giriş tamamlanamadı.');
    } catch (err: any) {
      if (err?.code) console.error('AUTH_SOCIAL_ERROR', err.code, err);
      if (String(err?.code || '').includes('operation-not-allowed')) {
        setError(
          provider === 'apple'
            ? 'Apple provider açık görünüyor; genelde eksik Apple ayarı (Service ID / Key ID / Team ID / .p8) veya yanlış Bundle/Service kimliği bu hatayı üretir.'
            : 'Google girişi Firebase’de kapalı. Firebase Console > Authentication > Sign-in method > Google bölümünü açın.',
        );
        return;
      }
      if (String(err?.message || '').includes('AUTH_TIMEOUT')) {
        setError('Giriş işlemi zaman aşımına uğradı. Tekrar deneyin veya "Giriş Yapmadan Devam Et" ile devam edin.');
        return;
      }
      setError(mapAuthErrorMessage(err));
    } finally {
      clearTimeout(failSafeTimer);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_10%,rgba(6,182,212,0.18),transparent_32%),radial-gradient(circle_at_86%_88%,rgba(37,99,235,0.2),transparent_38%),#f8fafc] flex items-center justify-center p-5">
      <section className="w-full max-w-md rounded-[2.2rem] border border-white/70 bg-white/90 p-6 shadow-2xl backdrop-blur-xl">
        <div className="text-center">
          <div className="relative mx-auto h-16 w-16 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg ring-1 ring-slate-200">
            <Image
              src={logoSrc}
              alt="Transport 245"
              fill
              priority
              onError={() => setLogoSrc('/playstore.png')}
              className="object-contain p-1"
            />
          </div>
          <h1 className="mt-4 text-2xl font-black uppercase tracking-wide text-slate-900">Giriş Yap</h1>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            {showAppleButton
              ? 'Uygulamaya Google veya Apple hesabınızla giriş yapabilirsiniz.'
              : 'Uygulamaya Google hesabınızla giriş yapabilirsiniz.'}
          </p>
        </div>

        {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{error}</p>}

        <div className="mt-5 space-y-2">
          <button
            onClick={() => socialLogin('google')}
            disabled={loading}
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 text-sm font-black uppercase tracking-wide text-slate-700 shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <GoogleLogo /> {loading ? 'İşleniyor...' : 'Google ile Giriş'}
          </button>
          {showAppleButton && (
            <button
              onClick={() => socialLogin('apple')}
              disabled={loading}
              className="w-full rounded-2xl border border-slate-900 bg-slate-900 py-3 text-sm font-black uppercase tracking-wide text-white shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <AppleLogo /> {loading ? 'İşleniyor...' : 'Apple ile Giriş'}
            </button>
          )}

          <button
            onClick={continueAsGuest}
            className="w-full rounded-2xl border border-blue-200 bg-blue-50 py-3 text-sm font-black tracking-wide text-blue-700 disabled:opacity-60"
          >
            Giriş Yapmadan Devam Et (Önerilmez)
          </button>
        </div>
      </section>
    </main>
  );
}
