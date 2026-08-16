import {Stack} from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="cuenta" />
      <Stack.Screen name="notificaciones" />
      <Stack.Screen name="preferencias" />
      <Stack.Screen name="privacidad-de-datos" />
      <Stack.Screen name="seguridad" />
      <Stack.Screen name="soporte" />
    </Stack>
  );
}