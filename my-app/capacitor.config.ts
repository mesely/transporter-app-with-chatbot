// capacitor.config.ts

import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.transporter.app',
  appName: 'Transporter',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor',
    cleartext: true
  },
  plugins: {
    Geolocation: {
      permission: 'whenInUse'
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#ffffff',
      overlaysWebView: true
    }
  },
  // iOS için sadece geçerli olan ayarlar
  ios: {
    contentInset: 'always',
    scrollEnabled: true
  }
};

export default config;