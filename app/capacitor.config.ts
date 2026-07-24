import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.centralscore.app',
  appName: 'CentralScore',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_football',
      iconColor: '#00c853',
    },
  },
};

export default config;
