// =====================================================================
// Comedor UAGRM — API Gateway REST.
// Valida JWT (Keycloak OIDC) y enruta a los 4 microservicios.
// =====================================================================
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const cors = require('cors');
const morgan = require('morgan');

const PORT = Number(process.env.PORT || 8080);
const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://keycloak:8080';
const REALM = process.env.KEYCLOAK_REALM || 'comedor-uagrm';
const JWKS_URI = `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/certs`;

const MENU_URL = process.env.MENU_URL || 'http://menu-inventario-service:8080';
const COMENSALES_URL = process.env.COMENSALES_URL || 'http://comensales-reservas-service:8080';
const PAGOS_URL = process.env.PAGOS_URL || 'http://pagos-tickets-service:8080';
const IA_URL = process.env.IA_URL || 'http://ia-ml-service:8080';

const client = jwksClient({ jwksUri: JWKS_URI, cache: true, rateLimit: true });

function getKey(header, cb) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return cb(err);
    cb(null, key.getPublicKey());
  });
}

function requireAuth(req, res, next) {
  if (process.env.AUTH_DISABLED === 'true') return next();
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'no token' });
  jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'token inválido', detail: err.message });
    req.user = decoded;
    next();
  });
}

const app = express();
app.use(morgan('tiny'));
app.use(cors());

app.get('/health', (req, res) => res.json({ status: 'UP', service: 'api-gateway' }));

// Rutas públicas (menú del día, consulta, login flow handled by Keycloak)
app.use('/public/menus', createProxyMiddleware({ target: MENU_URL, changeOrigin: true, pathRewrite: { '^/public/menus': '/menus' } }));

// En http-proxy-middleware v3 usamos pathFilter: así el request completo (/menus/semana/...)
// llega sin que express.use lo recorte y Spring Boot lo matchea bien.
const proxyAll = (patterns, target) => createProxyMiddleware({
  pathFilter: patterns,
  target,
  changeOrigin: true,
});

app.use(requireAuth, proxyAll(['/menus/**', '/insumos/**', '/porciones/**'], MENU_URL));
app.use(requireAuth, proxyAll(['/reservas/**', '/estudiantes/**', '/ingreso/**'], COMENSALES_URL));
app.use(requireAuth, proxyAll(['/pagos/**', '/facturas/**'], PAGOS_URL));
app.use(requireAuth, proxyAll(['/ml/**', '/agentes/**', '/reportes/**', '/sagas/**'], IA_URL));

app.listen(PORT, () => console.log(`[api-gateway] listo en :${PORT}`));
