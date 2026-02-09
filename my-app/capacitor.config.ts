import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.transporter.app',
  appName: 'Transporter',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor',
    cleartext: true,
    allowNavigation: [
      'transporter-app-with-chatbot.onrender.com',
      'router.project-osrm.org',
      '*.basemaps.cartocdn.com',
      '*.openstreetmap.org'
    ]
  },
  plugins: {
    Geolocation: {
      permission: 'whenInUse'
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#ffffff',
      overlaysWebView: true
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true
    }
  },
  // 🛠️ Hatalı 'displayName' kaldırıldı, sadece geçerli özellikler kaldı.
  ios: {
    contentInset: 'always',
    scrollEnabled: true
  }
};

export default config;