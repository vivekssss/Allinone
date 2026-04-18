import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="login"
          options={{ headerShown: false, presentation: 'modal' }}
        />
        <Stack.Screen
          name="settings"
          options={{
            headerShown: true,
            title: 'Settings',
            headerStyle: { backgroundColor: Colors.surface },
            headerTintColor: Colors.textPrimary,
            presentation: 'modal',
          }}
        />
      </Stack>
    </>
  );
}
