# SomnGuard Mobile Front-end

Proyecto React Native + Expo Router organizado con arquitectura Feature-Based. La carpeta `src/app/` contiene solo rutas; la logica de negocio vive en `src/features/` y lo reutilizable vive en `src/shared/`.

## Arquitectura

```txt
src/
  app/                    Rutas de Expo Router
    (auth)/               Login y registro
    (tabs)/               Pantallas principales despues de login
  features/               Funcionalidades del producto
    auth/                 Login, registro y servicio de autenticacion
    dashboard/            Pantalla principal
    monitoring/           Estado y datos de monitoreo
    history/              Historial de sesiones
    profile/              Perfil y ajustes de cuenta
    device-pairing/       Base para vinculacion del dispositivo externo
  shared/                 Componentes UI, tema y utilidades reutilizables
```

## Reglas de organizacion

- `src/app` solo define rutas y layouts.
- Cada feature contiene sus pantallas, hooks, servicios, tipos y mocks propios.
- `shared` no debe depender de ninguna feature.
- Una feature puede usar `shared`, pero evita importar archivos internos de otra feature salvo que se expongan desde su `index.ts`.
- Los assets y archivos de configuracion de Expo se quedan en la raiz del proyecto.

## Correr

```bash
npm install
npm run start
```

## Video en vivo en Android

La pantalla de monitoreo abre una sesión de video a demanda. Usa LiveKit/WebRTC en APK nativo; el relay MJPEG del API queda como ruta alternativa cuando el API no entrega credenciales LiveKit. El botón **Pausar cámara** cierra la sesión del dispositivo. **Pausar detección** es un control separado y detiene las alertas del Pi, igual que en el portal.

Expo Go no contiene el módulo nativo de LiveKit. Para probar el video hay que generar e instalar un APK:

```bash
npm install
npm run build:android:apk
```

Antes del build, define `EXPO_PUBLIC_API_URL` como la URL base del API **sin** `/api/v1` ni `/` final, por ejemplo en `.env` o en el entorno `preview` de EAS. Para un teléfono físico, `localhost` apunta al teléfono: usa un host accesible desde el Wi‑Fi del teléfono o una URL pública HTTPS. La respuesta del API también debe incluir un `livekit_url` accesible desde ese teléfono; si se prueba fuera de la LAN, LiveKit necesita TURN público según la configuración de red.

El plugin `plugins/withLiveKitAndroidSetup.js` registra LiveKit en `MainApplication` antes de iniciar React Native durante cada prebuild. La URL local por HTTP está permitida para pruebas; producción debe usar HTTPS/WSS.

## Usuarios mock

```txt
admin@somnguard.com / 1234
prueba@test.com / abcd
```
