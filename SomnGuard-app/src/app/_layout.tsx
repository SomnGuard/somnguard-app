import '@/shared/i18n';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useAppTheme } from '@/shared/theme';
import { MonitoringProvider } from '@/features/monitoring/hooks/useMonitoring';
import { initializeLiveKit } from '@/features/monitoring/services/livekitRuntime';

// Register WebRTC before any screen can create a LiveKit room. Expo Go has no
// native WebRTC module, so its relay-only fallback remains available there.
initializeLiveKit();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <MonitoringProvider>
          <RootNavigator />
        </MonitoringProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { colorScheme, theme } = useAppTheme();

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
