// Direcciones de los servidores. Se pueden cambiar desde la pantalla de ingreso (Servidor) sin reinstalar la app.
import Constants from 'expo-constants';

const extra = (Constants.expoConfig && Constants.expoConfig.extra) || {};

export const PREDETERMINADO = {
  api: extra.apiUrl || 'http://192.168.100.65:8080',        // gateway del comedor (tu PC en la red local)
  keycloak: extra.keycloakUrl || 'http://44.252.104.3:8085', // cuentas y roles
  realm: 'comedor-uagrm',
  clientId: 'app-movil',
};

export const limpiarUrl = (u) => String(u || '').trim().replace(/\/+$/, '');
