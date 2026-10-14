import type { CapacitorConfig } from '@capacitor/cli';

// Native shell configuration. `npm run build` fills dist/, then
// `npx cap sync` copies it into the iOS project. The bundle uses relative
// asset paths (vite base './') so it loads from the Capacitor origin.
const config: CapacitorConfig = {
  appId: 'com.oneycollectibles.scalpingsquishies',
  appName: 'Scalping Squishies',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
    backgroundColor: '#1a1030',
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#ff7ac8',
    },
  },
};

export default config;
