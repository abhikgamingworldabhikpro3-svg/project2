export interface CapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  server?: {
    androidScheme?: string;
  };
  plugins?: Record<string, unknown>;
}

const config: CapacitorConfig = {
  appId: 'com.tutorflow.app',
  appName: 'TutorFlow',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#4F46E5',
    },
  },
};

export default config;
