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

## Usuarios mock

```txt
admin@somnguard.com / 1234
prueba@test.com / abcd
```
