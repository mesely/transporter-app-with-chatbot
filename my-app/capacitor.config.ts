import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.trasport245.app',
  appName: 'Transport 245',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor',
    cleartext: true,
    allowNavigation: [
      'transporter-app-with-chatbot.onrender.com',
      'transport-245.firebaseapp.com',
      'accounts.google.com',
      'apis.google.com',
      'www.googleapis.com',
      'securetoken.googleapis.com',
      'identitytoolkit.googleapis.com',
      'www.facebook.com',
      'm.facebook.com',
      'graph.facebook.com',
      'router.project-osrm.org',
      'basemaps.cartocdn.com',
      'a.basemaps.cartocdn.com',
      'b.basemaps.cartocdn.com',
      'c.basemaps.cartocdn.com',
      'd.basemaps.cartocdn.com',
      'tile.openstreetmap.org',
      'a.tile.openstreetmap.org',
      'b.tile.openstreetmap.org',
      'c.tile.openstreetmap.org',
    ],
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com', 'apple.com'],
    },
    Geolocation: {
      permission: 'whenInUse',
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#ffffff',
      overlaysWebView: true,
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
  },
  ios: {
    contentInset: 'always',
    preferredContentMode: 'mobile',
    scrollEnabled: true,
    // 🔥 WKWebView bellek baskısını azaltmak için:
    // limitsiz wildcard domain izni kaldırıldı (yukarıda explicit liste var)
  },
};

export default config;
