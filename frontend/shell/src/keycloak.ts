import Keycloak from 'keycloak-js';

// Keycloak único global compartido entre shell y todos los remotes (SSO)
const KC_URL = import.meta.env.VITE_KEYCLOAK_URL || 'http://44.252.104.3:8085';

export const keycloak = new Keycloak({
  url: KC_URL,
  realm: 'comedor-uagrm',
  clientId: 'shell',
});

// Exponer en window para que los REMOTES lo consuman sin reinicializar Keycloak
if (typeof window !== 'undefined') {
  (window as any).__COMEDOR_KEYCLOAK__ = keycloak;
}
