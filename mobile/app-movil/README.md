# App móvil Comedor UAGRM

App React Native + Expo. Dos modos:
- **Estudiante** — menú, reserva, pago QR, mostrar QR
- **Punto de servicio** — validar QR offline (SQLite), foto de bandeja → IA local (TFLite)

## Correr local
```bash
npm install
npx expo start
```

Luego escanear el QR con la app **Expo Go** (Android/iOS).

## IA local (SPEC §7)
- `@tensorflow/tfjs-react-native` + modelos exportados en `ml/models/*.tflite`
- CNN de desperdicio en bandeja (foto → % sobrante por componente)
- Nota de voz → transcripción on-device

## Offline + idempotencia (SPEC §6)
- `expo-sqlite` guarda cola de operaciones pendientes con `idem_key`
- Cache de reservas del turno descargada al inicio para validar QR sin internet
- Reintentos con backoff exponencial 1s → 2s → 4s → 8s al volver la red
