import React, { Suspense, useEffect, useState, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { keycloak } from './keycloak';

// Por defecto apuntar a los microfrontends desplegados en AWS, así el shell
// funciona aunque no corras Angular/Next.js en local. Si corres uno local,
// pisá con VITE_BI_URL / VITE_BACKOFFICE_URL.
const BI_URL = import.meta.env.VITE_BI_URL || 'http://44.252.104.3:3003?embedded=1';
const BACKOFFICE_URL = import.meta.env.VITE_BACKOFFICE_URL || 'http://44.252.104.3:3001?embedded=1';

// MODULE FEDERATION: Portal se carga como módulo federado real
// Backoffice (Angular) y BI (Next.js) se integran por iframe + postMessage SSO
// porque Angular+Vite y Next.js App Router no son compatibles con Module Federation
// sin perder features críticas de cada framework.
// @ts-expect-error federated module
const RemotePortal = lazy(() => import('portal/App').catch(() => ({ default: () => <RemoteFallback name="Portal" /> })));

function RemoteFallback({ name }: { name: string }) {
  return (
    <div className="p-12 text-center">
      <div className="text-6xl mb-4">⚠️</div>
      <h2 className="text-xl font-bold text-white">Remote <code className="text-cyan-400">{name}</code> no disponible</h2>
      <p className="text-slate-400 text-sm mt-2">El microfrontend aún no está corriendo. Arrancá el servicio y recargá.</p>
    </div>
  );
}

function LoginScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900">
      <div className="w-full max-w-md p-8 bg-slate-800/60 backdrop-blur rounded-2xl border border-slate-700 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-orange-500 to-cyan-500 rounded-2xl flex items-center justify-center text-4xl mb-4">🍽️</div>
          <h1 className="text-3xl font-bold text-white">Comedor UAGRM</h1>
          <p className="text-slate-400 mt-2 text-sm">Plataforma Multi-microfrontend</p>
          <p className="text-xs text-cyan-400 font-mono mt-1">Shell · Module Federation · Keycloak SSO</p>
        </div>
        <button onClick={() => keycloak.login({ redirectUri: window.location.origin + '/portal' })}
          className="w-full py-4 bg-gradient-to-r from-orange-500 to-cyan-500 text-white font-semibold rounded-xl shadow-lg hover:scale-[1.02] transition-all">
          🔐 Iniciar sesión única
        </button>
        <div className="mt-6 p-4 bg-slate-900/50 rounded-lg space-y-1">
          <p className="text-xs text-slate-400 font-medium">Cuentas demo:</p>
          <code className="block text-xs text-cyan-400">admin.comedor / admin123</code>
          <code className="block text-xs text-cyan-400">estudiante.demo / demo123</code>
          <code className="block text-xs text-cyan-400">nutricionista.demo / nutri123</code>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ user, roles }: { user: string, roles: string[] }) {
  const esAdmin = roles.some(r => r === 'administrador' || r.toLowerCase().includes('admin'));
  const esCocinero = roles.some(r => r.toLowerCase().includes('cocinero'));
  const esNutri = roles.some(r => r.toLowerCase().includes('nutri'));
  const esEstudiante = roles.some(r => r === 'estudiante' || r.toLowerCase().includes('estudiante'));
  const esCaja = roles.some(r => r.toLowerCase().includes('caja'));
  // Si no tiene ningún rol conocido, por defecto vista estudiante.
  const sinRol = !esAdmin && !esCocinero && !esNutri && !esCaja && !esEstudiante;
  const allItems = [
    { to: '/portal', icon: '🎓', label: 'Portal estudiante', badge: 'React · Module Federation', color: 'cyan',
      show: esEstudiante || sinRol },
    { to: '/backoffice', icon: '🧑‍🍳', label: 'Back-office gestión', badge: 'Angular · iframe + SSO', color: 'purple',
      show: esAdmin || esCocinero || esCaja },
    { to: '/bi', icon: '📊', label: 'Inteligencia Negocio', badge: 'Next.js · iframe + SSO', color: 'orange',
      show: esAdmin || esNutri },
  ];
  const items = allItems.filter(i => i.show);
  const nav = useNavigate();
  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 min-h-screen sticky top-0 flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-cyan-500 rounded-lg flex items-center justify-center text-xl">🍽️</div>
          <div>
            <div className="font-bold text-white">Comedor UAGRM</div>
            <div className="text-xs text-emerald-400 font-mono">Shell · host</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 overflow-auto">
        <div className="text-[10px] font-bold text-slate-500 px-3 mb-2 tracking-wider">MICROFRONTENDS</div>
        <div className="space-y-1">
          {items.map(i => (
            <NavLink key={i.to} to={i.to}
              className={({ isActive }) => "flex items-start gap-3 px-3 py-3 rounded-lg transition " +
                (isActive ? "bg-gradient-to-r from-slate-800 to-slate-800/50 text-white border-l-2 border-orange-500" : "text-slate-400 hover:bg-slate-800 hover:text-white")}>
              <span className="text-xl mt-0.5">{i.icon}</span>
              <div className="flex-1">
                <div className="text-sm font-medium">{i.label}</div>
                <div className={"text-[10px] text-" + i.color + "-400 font-mono mt-0.5"}>{i.badge}</div>
              </div>
            </NavLink>
          ))}
        </div>
      </nav>
      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-lg p-3 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-sm font-bold">{user[0]?.toUpperCase()}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{user}</div>
              <div className="text-xs text-emerald-400">● SSO activo</div>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 mt-2 truncate">{roles.join(' · ')}</div>
        </div>
        <button onClick={() => keycloak.logout({ redirectUri: window.location.origin })}
          className="w-full py-2 text-xs text-slate-400 hover:text-red-400 transition">⎋ Cerrar sesión</button>
      </div>
    </aside>
  );
}

function HomePage({ user, roles }: { user: string; roles: string[] }) {
  const nav = useNavigate();
  const esAdmin = roles.some(r => r === 'administrador' || r.toLowerCase().includes('admin'));
  const esCocinero = roles.some(r => r.toLowerCase().includes('cocinero'));
  const esNutri = roles.some(r => r.toLowerCase().includes('nutri'));
  const esEstudiante = roles.some(r => r === 'estudiante' || r.toLowerCase().includes('estudiante'));
  const esCaja = roles.some(r => r.toLowerCase().includes('caja'));
  const noConocido = !esAdmin && !esCocinero && !esNutri && !esEstudiante && !esCaja;

  const tiles = [
    { to: '/portal', icon: '🎓', title: 'Portal estudiante', desc: 'Menú, reservas, pago QR, mi beca', badge: 'React · remote federado', color: 'cyan',
      show: esEstudiante || noConocido },
    { to: '/backoffice', icon: '🧑‍🍳', title: 'Back-office gestión', desc: 'Menú, inventario, caja QR, estudiantes y becas', badge: 'Angular · iframe + SSO', color: 'purple',
      show: esAdmin || esCocinero || esCaja },
    { to: '/bi', icon: '📊', title: 'Inteligencia de Negocio', desc: 'Dashboards ML, agentes IA, reportes LLM', badge: 'Next.js · iframe + SSO', color: 'orange',
      show: esAdmin || esNutri },
  ].filter(t => t.show);

  const rolLabel = esAdmin ? 'Administrador' : esCocinero ? 'Cocinero' : esCaja ? 'Caja' : esNutri ? 'Nutricionista' : esEstudiante ? 'Estudiante' : 'Sin rol asignado';

  return (
    <div className="p-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-orange-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
          Hola, {user}
        </h1>
        <p className="text-slate-400 text-lg mb-2">Sesión activa como <span className="text-cyan-400 font-semibold">{rolLabel}</span></p>
        <p className="text-slate-500 text-sm mb-10">Elegí una aplicación del menú lateral. Tu rol determina qué módulos ves.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {tiles.map(t => (
            <button key={t.to} onClick={() => nav(t.to)} className={`group bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-${t.color}-500 rounded-xl p-6 text-left transition-all`}>
              <div className="text-5xl mb-3">{t.icon}</div>
              <h3 className="font-bold text-white text-lg">{t.title}</h3>
              <p className="text-xs text-slate-400 mt-1">{t.desc}</p>
              <div className={`mt-3 text-xs text-${t.color}-400 font-mono`}>{t.badge}</div>
            </button>
          ))}
        </div>
        {tiles.length === 0 && (
          <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-6 text-amber-300">
            Tu usuario no tiene roles asignados en Keycloak. Avisá al administrador.
          </div>
        )}
      </div>
    </div>
  );
}

// Embed de iframe con SSO vía postMessage + cookie compartida
function MicrofrontendIframe({ url, token, title }: { url: string, token: string, title: string }) {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const sendToken = () => iframeRef.current?.contentWindow?.postMessage({ type: 'SSO_TOKEN', token }, '*');
    const t = setTimeout(sendToken, 1500);
    const handler = (e: MessageEvent) => { if (e.data?.type === 'MF_READY') sendToken(); };
    window.addEventListener('message', handler);
    return () => { clearTimeout(t); window.removeEventListener('message', handler); };
  }, [token, url]);
  return <iframe ref={iframeRef} src={url} className="w-full h-screen border-0 block" title={title} />;
}

function App() {
  const [ready, setReady] = useState(false);
  const [auth, setAuth] = useState(false);
  const [user, setUser] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [token, setToken] = useState('');

  useEffect(() => {
    keycloak.init({ onLoad: 'check-sso', checkLoginIframe: false, pkceMethod: 'S256' })
      .then(a => {
        setReady(true); setAuth(a);
        if (a && keycloak.tokenParsed) {
          setUser((keycloak.tokenParsed as any).preferred_username || '');
          setRoles(((keycloak.tokenParsed as any).realm_access?.roles || []).filter((r: string) => !r.startsWith('default-') && !r.startsWith('offline') && !r.startsWith('uma')));
          setToken(keycloak.token || '');
          // Propagar token para los REMOTES
          localStorage.setItem('kc_token', keycloak.token || '');
          document.cookie = `kc_token=${keycloak.token}; path=/`;
          (window as any).__KEYCLOAK_TOKEN__ = keycloak.token;
        }
      }).catch(e => { setReady(true); console.error('kc init', e); });

    // refresh token cada 60s
    const i = setInterval(() => {
      if (keycloak.authenticated) {
        keycloak.updateToken(70).then(() => {
          localStorage.setItem('kc_token', keycloak.token || '');
          setToken(keycloak.token || '');
        }).catch(() => keycloak.logout());
      }
    }, 60000);
    return () => clearInterval(i);
  }, []);

  if (!ready) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">Iniciando SSO…</div>;
  if (!auth) return <LoginScreen />;

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-slate-900">
        <Sidebar user={user} roles={roles} />
        <main className="flex-1 overflow-auto">
          <Suspense fallback={<div className="p-12 text-slate-400">Cargando microfrontend remoto…</div>}>
            <Routes>
              <Route path="/" element={<HomePage user={user} roles={roles} />} />
              <Route path="/portal/*" element={<RemotePortal />} />
              <Route path="/backoffice/*" element={<MicrofrontendIframe url={BACKOFFICE_URL} token={token} title="Back-office" />} />
              <Route path="/bi" element={<MicrofrontendIframe url={BI_URL} token={token} title="Inteligencia de Negocio" />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
