@echo off
echo ================================================
echo   Comedor UAGRM - App movil (Expo)
echo ================================================
echo.
echo Verificando dependencias...
if not exist node_modules\ (
  echo Primera vez - instalando dependencias ^(2-3 min^)...
  call npm install --legacy-peer-deps
)
echo.
echo Arrancando Expo con tunnel ^(QR aparece en pantalla^)...
echo.
echo INSTRUCCIONES:
echo   1. Instala "Expo Go" desde Play Store / App Store
echo   2. Escanea el QR que aparezca aqui con Expo Go
echo   3. La app se abre en tu movil conectada a AWS us-west-2
echo.
call npx expo start --tunnel
