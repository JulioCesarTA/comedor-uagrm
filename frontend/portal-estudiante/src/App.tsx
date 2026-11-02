// Componente REMOTO del Portal estudiante.
// Exportado via Module Federation para que el shell lo importe.
// Lee el token Keycloak desde el shell (localStorage o window global).
import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import * as tf from '@tensorflow/tfjs';

const API = (import.meta as any).env?.VITE_API_URL || 'http://44.252.104.3:8080';

type Turno = 'DESAYUNO' | 'ALMUERZO' | 'CENA';

function hashVec(txt: string, dim = 64): number[] {
  const v = new Array(dim).fill(0);
  txt.toLowerCase().split(/\s+/).forEach(t => {
    let h = 0; for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0;
    v[h % dim] += 1;
  });
  return v;
}
function tfSim(a: number[], b: number[]): number {
  return tf.tidy(() => {
    const ta = tf.tensor1d(a), tb = tf.tensor1d(b);
    const dot = ta.mul(tb).sum().arraySync() as number;
    const na = ta.norm().arraySync() as number, nb = tb.norm().arraySync() as number;
    return na * nb > 0 ? dot / (na * nb) : 0;
  });
}

// Obtiene el username y token del shell (SSO)
function useSSO() {
  const [user, setUser] = useState('');
  const [token, setToken] = useState('');
  useEffect(() => {
    const t = (window as any).__KEYCLOAK_TOKEN__ || localStorage.getItem('kc_token') || '';
    setToken(t);
    try {
      const payload = JSON.parse(atob(t.split('.')[1]));
      setUser(payload.preferred_username || 'estudiante');
    } catch { setUser('estudiante'); }
    if (t) axios.defaults.headers.common['Authorization'] = `Bearer ${t}`;
  }, []);
  return { user, token };
}

type Tab = 'menu' | 'reservas' | 'beca' | 'qr' | 'historial' | 'perfil';

type Reserva = {
  plato: string; fecha: string; turno: string;
  reservaId: string; status: string;
  metodo?: string; monto?: number;
  stripeUrl?: string; qrDataUri?: string;
  pagadaAt?: string; createdAt: string;
};

const STORAGE_KEY = (u: string) => `portal.reservas.${u || 'anon'}`;

export default function App() {
  const { user } = useSSO();
  const [turno, setTurno] = useState<Turno>('ALMUERZO');
  const [menus, setMenus] = useState<any[]>([]);
  const [beca, setBeca] = useState<any>(null);
  const [tab, setTab] = useState<Tab>('menu');
  const [reserva, setReserva] = useState<any>(null);
  const [historial, setHistorial] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [toast, setToast] = useState<{ msg: string, kind: 'ok' | 'err' } | null>(null);
  const [pagoOk, setPagoOk] = useState<Reserva | null>(null);

  // Rehidratar historial desde localStorage al cambiar user
  useEffect(() => {
    if (!user) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY(user));
      if (raw) setHistorial(JSON.parse(raw));
    } catch {}
  }, [user]);

  // Persistir cada cambio
  useEffect(() => {
    if (user) try { localStorage.setItem(STORAGE_KEY(user), JSON.stringify(historial)); } catch {}
  }, [user, historial]);

  useEffect(() => { axios.get(`${API}/menus/semana/${turno}`).then(r => setMenus(r.data)).catch(() => {}); }, [turno]);
  useEffect(() => { if (user) axios.get(`${API}/estudiantes/${user}/beca`).then(r => setBeca(r.data)).catch(() => {}); }, [user]);

  const ranked = useMemo(() => {
    if (!busqueda) return menus;
    const qv = hashVec(busqueda);
    return menus.map(m => ({
      ...m,
      _ranked: Object.keys(m.porciones || {}).map(id => ({ id, sim: tfSim(hashVec(id.replace(/[-_]/g, ' ')), qv) })).sort((a, b) => b.sim - a.sim)
    }));
  }, [busqueda, menus]);

  const notif = (msg: string, kind: 'ok' | 'err') => { setToast({ msg, kind }); setTimeout(() => setToast(null), 4000); };

  const reservar = async (menuId: string, platoId: string, fecha: string, t: string) => {
    setLoading(platoId);
    try {
      const idem = `portal-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const metodo = beca?.cubreHoy ? 'beca' : 'qr_bancario';
      const r = await axios.post(`${API}/sagas/reservar-y-pagar`, {
        estudiante_id: user, menu_id: menuId, plato_id: platoId, fecha, turno: t, metodo_pago: metodo, monto: 10, idempotency_key: idem,
      });
      setReserva(r.data);
      const nueva: Reserva = {
        plato: platoId, fecha, turno: t, reservaId: r.data.reservaId,
        status: r.data.status || 'PENDIENTE_PAGO',
        metodo, monto: 10,
        stripeUrl: r.data.stripe?.paymentUrl,
        qrDataUri: r.data.stripe?.qrDataUri || (r.data.qr && r.data.qr.split('::')[1]),
        createdAt: new Date().toISOString(),
      };
      setHistorial(h => [nueva, ...h]);
      if (metodo === 'beca') {
        // Beca cubre → confirmación inmediata
        nueva.status = 'PAGADA';
        nueva.pagadaAt = new Date().toISOString();
        setHistorial(h => h.map(x => x.reservaId === nueva.reservaId ? nueva : x));
        setPagoOk(nueva);
      } else {
        notif(`Reserva ${r.data.reservaId.slice(0, 8)}… — abrí el pago`, 'ok');
      }
    } catch (e: any) {
      notif('Error: ' + (e.response?.data?.detail || e.message), 'err');
    } finally { setLoading(null); }
  };

  const [verificando, setVerificando] = useState(false);

  // VERIFICA REAL CONTRA STRIPE: pregunta al backend si la plink está paid.
  // Solo si Stripe confirma pago, marca PAGADA. Si no, muestra error y la reserva
  // queda PENDIENTE_PAGO en el historial.
  const confirmarPago = async () => {
    if (!reserva?.reservaId) return;
    const plink = reserva?.stripe?.gatewayRef;
    if (!plink) { notif('No hay referencia Stripe para verificar', 'err'); return; }
    setVerificando(true);
    try {
      const r = await axios.get(`${API}/pagos/verificar/${encodeURIComponent(plink)}`);
      if (r.data?.paid === true) {
        const now = new Date().toISOString();
        setHistorial(h => h.map(x =>
          x.reservaId === reserva.reservaId
            ? { ...x, status: 'PAGADA', pagadaAt: now }
            : x
        ));
        const confirmada = historial.find(x => x.reservaId === reserva.reservaId);
        setPagoOk(confirmada ? { ...confirmada, status: 'PAGADA', pagadaAt: now } : null);
        setReserva(null);
        notif('✅ Stripe confirmó el pago', 'ok');
      } else {
        notif(`⏳ Pago aún no confirmado por Stripe (status: ${r.data?.status || 'open'})`, 'err');
      }
    } catch (e: any) {
      notif('Error verificando contra Stripe: ' + (e.response?.data?.error || e.message), 'err');
    } finally {
      setVerificando(false);
    }
  };

  const tabs: { id: Tab, icon: string, label: string }[] = [
    { id: 'menu', icon: '🍽️', label: 'Menú' },
    { id: 'reservas', icon: '📋', label: 'Mis reservas' },
    { id: 'beca', icon: '🎓', label: 'Mi beca' },
    { id: 'qr', icon: '🎫', label: 'Mi QR' },
    { id: 'historial', icon: '📜', label: 'Historial' },
    { id: 'perfil', icon: '👤', label: 'Perfil' },
  ];

  return (
    <div className="p-6 text-slate-100">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">🎓 Portal Estudiante</h1>
              <p className="text-xs text-cyan-400 font-mono">React remote · federado desde el shell · SSO <code>{user}</code></p>
            </div>
            {beca?.tieneBeca && (
              <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/40 rounded-lg">
                <div className="text-xs text-emerald-400">Beca activa</div>
                <div className="text-sm text-white font-semibold">{beca.tipo} · {beca.racionesUsadasMes}/{beca.cupoRacionesMes}</div>
              </div>
            )}
          </div>
        </header>

        <nav className="flex gap-1 border-b border-slate-800 mb-6">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={"px-4 py-3 text-sm font-medium transition " +
                (tab === t.id ? "border-b-2 border-cyan-500 text-white" : "text-slate-400 hover:text-white")}>
              {t.icon} {t.label}
            </button>
          ))}
        </nav>

        {tab === 'menu' && (
          <>
            <div className="flex gap-3 mb-5">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
                <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
                  placeholder="Búsqueda semántica (TF.js on-device)"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-lg" />
              </div>
              <select value={turno} onChange={e => setTurno(e.target.value as Turno)}
                className="px-4 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-lg">
                <option>DESAYUNO</option><option>ALMUERZO</option><option>CENA</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ranked.length === 0 && <div className="col-span-full text-center py-10 text-slate-500">Sin menús publicados.</div>}
              {ranked.map(m => (
                <div key={m.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                  <div className="flex justify-between items-center mb-3">
                    <b className="text-white">📅 {m.fecha}</b>
                    <span className="px-2 py-0.5 bg-slate-700 text-xs text-slate-300 rounded">{m.turno}</span>
                  </div>
                  {(m._ranked || Object.keys(m.porciones || {}).map((id: string) => ({ id, sim: 1 }))).map((s: any) => {
                    const p = m.porciones[s.id];
                    const pct = (p.disponibles / p.cupo) * 100;
                    return (
                      <div key={s.id} className="border-t border-slate-700 pt-3 mt-3">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <div className="text-white text-sm font-medium">{s.id}</div>
                            <div className="text-xs text-slate-400">{p.disponibles}/{p.cupo} disp. {busqueda && <span className="text-cyan-400">· {(s.sim * 100).toFixed(0)}%</span>}</div>
                          </div>
                          <button onClick={() => reservar(m.id, s.id, m.fecha, m.turno)} disabled={!p.disponibles || loading === s.id}
                            className={"px-4 py-1.5 rounded-lg text-sm font-medium " + (p.disponibles ? "bg-gradient-to-r from-orange-500 to-cyan-500 text-white" : "bg-slate-700 text-slate-500")}>
                            {loading === s.id ? '…' : (p.disponibles ? 'Reservar' : 'Agotado')}
                          </button>
                        </div>
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-orange-500 to-cyan-500" style={{ width: pct + '%' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'reservas' && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold">📋 Mis reservas <span className="text-xs text-slate-500 font-normal">({historial.length})</span></h3>
              <button onClick={() => { if (confirm('¿Borrar todo el historial local?')) { setHistorial([]); localStorage.removeItem(STORAGE_KEY(user)); } }}
                className="text-xs text-slate-500 hover:text-red-400">Limpiar</button>
            </div>
            {historial.length === 0 ? <div className="text-center py-8 text-slate-500">Sin reservas. Reservá en Menú.</div> :
              <div className="space-y-2">
                {historial.map((r, i) => {
                  const esPagada = r.status === 'PAGADA';
                  return (
                    <div key={r.reservaId || i} className="bg-slate-900/50 rounded-lg p-4 flex justify-between items-center">
                      <div className="flex-1">
                        <div className="text-white font-medium">{r.plato}</div>
                        <div className="text-xs text-slate-400">{r.fecha} · {r.turno} · {r.metodo || 'qr_bancario'} · Bs {r.monto || 10}</div>
                        <code className="text-[10px] text-slate-500 block mt-1">#{r.reservaId?.slice(0, 16)}</code>
                      </div>
                      <div className="text-right ml-3">
                        <span className={"text-xs px-2.5 py-1 rounded-full font-mono " + (esPagada ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400')}>
                          {esPagada ? '✅ PAGADA' : '⏳ ' + r.status}
                        </span>
                        {r.pagadaAt && <div className="text-[10px] text-slate-500 mt-1">pagada {new Date(r.pagadaAt).toLocaleString()}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>}
          </div>
        )}

        {tab === 'beca' && beca && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <pre className="text-xs text-slate-300 font-mono bg-slate-900 p-4 rounded-lg">{JSON.stringify(beca, null, 2)}</pre>
          </div>
        )}

        {tab === 'qr' && reserva?.qr && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
            <h3 className="text-white font-bold mb-6">🎫 Tu QR</h3>
            <img src={reserva.qr.split('::')[1]} alt="QR" className="inline-block max-w-[260px] bg-white p-4 rounded-xl" />
            <code className="block mt-4 text-xs text-cyan-400">Reserva {reserva.reservaId?.slice(0, 16)}…</code>
          </div>
        )}

        {tab === 'qr' && !reserva?.qr && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-10 text-center">
            <div className="text-6xl mb-4">🎫</div>
            <h3 className="text-white font-bold">Sin QR activo</h3>
            <p className="text-slate-400 text-sm mt-2">Reservá una ración para generar tu QR</p>
          </div>
        )}

        {tab === 'historial' && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 className="text-white font-bold mb-4">📜 Historial completo</h3>
            {historial.length === 0 ? <div className="text-center py-8 text-slate-500">Aún no reservaste nada.</div> :
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-3 mb-4 text-center">
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-white">{historial.length}</div>
                    <div className="text-[10px] text-slate-400 uppercase">Total</div>
                  </div>
                  <div className="bg-emerald-500/10 rounded-lg p-3">
                    <div className="text-2xl font-bold text-emerald-400">{historial.filter(r => r.status === 'PAGADA').length}</div>
                    <div className="text-[10px] text-emerald-400 uppercase">Pagadas</div>
                  </div>
                  <div className="bg-amber-500/10 rounded-lg p-3">
                    <div className="text-2xl font-bold text-amber-400">{historial.filter(r => r.status !== 'PAGADA').length}</div>
                    <div className="text-[10px] text-amber-400 uppercase">Pendientes</div>
                  </div>
                  <div className="bg-cyan-500/10 rounded-lg p-3">
                    <div className="text-2xl font-bold text-cyan-400">Bs {historial.filter(r => r.status === 'PAGADA').reduce((s, r) => s + (r.monto || 10), 0)}</div>
                    <div className="text-[10px] text-cyan-400 uppercase">Pagado</div>
                  </div>
                </div>
                <table className="w-full text-sm">
                  <thead className="text-xs text-slate-500 uppercase border-b border-slate-700">
                    <tr><th className="text-left py-2">Fecha</th><th className="text-left">Plato</th><th>Turno</th><th>Método</th><th>Monto</th><th>Estado</th></tr>
                  </thead>
                  <tbody>
                    {historial.map((r, i) => (
                      <tr key={i} className="border-b border-slate-800">
                        <td className="py-2 text-slate-300">{r.fecha}</td>
                        <td className="text-white">{r.plato}</td>
                        <td className="text-center text-slate-400">{r.turno}</td>
                        <td className="text-center text-slate-400 text-xs font-mono">{r.metodo}</td>
                        <td className="text-center text-slate-400">Bs {r.monto || 10}</td>
                        <td className="text-center">
                          <span className={"text-xs px-2 py-0.5 rounded font-mono " + (r.status === 'PAGADA' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400')}>{r.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>}
          </div>
        )}

        {tab === 'perfil' && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-cyan-500 rounded-full flex items-center justify-center text-2xl font-bold text-white">{user[0]?.toUpperCase()}</div>
              <div>
                <h2 className="text-xl font-bold text-white">{user}</h2>
                <div className="text-xs text-emerald-400">SSO Keycloak OIDC</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <div className="bg-slate-900/50 rounded-lg p-3"><div className="text-xs text-slate-400">Microfrontend</div><div className="text-sm text-cyan-400 font-mono">React remote</div></div>
              <div className="bg-slate-900/50 rounded-lg p-3"><div className="text-xs text-slate-400">IA local</div><div className="text-sm text-cyan-400 font-mono">TF.js activo</div></div>
            </div>
          </div>
        )}

        {reserva?.stripe?.paymentUrl && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-slate-700 shadow-2xl">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h3 className="text-white font-bold text-lg">💳 Pagá con Stripe</h3>
                  <p className="text-xs text-slate-400 mt-1">Reserva #{reserva.reservaId?.slice(0, 10)}…</p>
                </div>
                <button onClick={() => setReserva(null)} className="text-slate-400 hover:text-white text-2xl leading-none">×</button>
              </div>
              <div className="bg-slate-900/60 rounded-xl p-4 mb-4">
                <div className="flex justify-between text-sm mb-2"><span className="text-slate-400">Monto</span><span className="text-white font-bold">Bs 10</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">Método</span><span className="text-cyan-400 font-mono text-xs">qr_bancario · stripe</span></div>
              </div>
              <a href={reserva.stripe.paymentUrl} target="_blank" rel="noreferrer"
                className="block py-3 bg-gradient-to-r from-orange-500 to-cyan-500 text-white font-semibold rounded-lg text-center mb-3 hover:scale-[1.02] transition">
                1) Abrir checkout Stripe →
              </a>
              {reserva.stripe.qrDataUri && (
                <div className="text-center mb-3">
                  <div className="text-[10px] text-slate-500 uppercase mb-2">o escaneá el QR</div>
                  <img src={reserva.stripe.qrDataUri} alt="QR" className="max-w-[180px] mx-auto bg-white p-2 rounded-lg" />
                </div>
              )}
              <div className="bg-slate-900/40 rounded p-2 text-center mb-3">
                <code className="text-xs text-cyan-400">Tarjeta test · 4242 4242 4242 4242</code>
              </div>
              <button onClick={confirmarPago} disabled={verificando}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center justify-center gap-2">
                {verificando ? (<><span className="animate-spin">⏳</span> Consultando a Stripe…</>) : (<>🔎 Verificar pago en Stripe</>)}
              </button>
              <p className="text-[10px] text-slate-500 text-center mt-2">
                Al verificar, el backend consulta <code className="text-cyan-500">checkout.sessions</code> de Stripe. Solo si está <code className="text-emerald-500">paid</code> se confirma la reserva.
              </p>
            </div>
          </div>
        )}

        {pagoOk && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setPagoOk(null)}>
            <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-emerald-500/50 shadow-2xl text-center animate-in" onClick={e => e.stopPropagation()}>
              <div className="w-20 h-20 mx-auto bg-emerald-500 rounded-full flex items-center justify-center text-5xl mb-4">✓</div>
              <h3 className="text-2xl font-bold text-white mb-2">¡Pago exitoso!</h3>
              <p className="text-slate-400 text-sm mb-5">Tu reserva está confirmada</p>
              <div className="bg-slate-900/60 rounded-xl p-4 mb-5 text-left">
                <div className="flex justify-between text-sm mb-2"><span className="text-slate-400">Plato</span><span className="text-white font-medium">{pagoOk.plato}</span></div>
                <div className="flex justify-between text-sm mb-2"><span className="text-slate-400">Fecha</span><span className="text-white">{pagoOk.fecha} · {pagoOk.turno}</span></div>
                <div className="flex justify-between text-sm mb-2"><span className="text-slate-400">Monto</span><span className="text-emerald-400 font-bold">Bs {pagoOk.monto || 10}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">Reserva</span><code className="text-cyan-400 text-xs">{pagoOk.reservaId?.slice(0, 12)}…</code></div>
              </div>
              {pagoOk.qrDataUri && (
                <div className="mb-4">
                  <div className="text-[10px] text-slate-500 uppercase mb-2">Mostrá este QR en caja</div>
                  <img src={pagoOk.qrDataUri} alt="QR reserva" className="max-w-[160px] mx-auto bg-white p-2 rounded-lg" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { setPagoOk(null); setTab('reservas'); }}
                  className="py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm">Ver mis reservas</button>
                <button onClick={() => setPagoOk(null)}
                  className="py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg text-sm font-semibold">Listo</button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div className={"fixed top-6 right-6 px-5 py-3 rounded-xl shadow-2xl z-50 " + (toast.kind === 'ok' ? "bg-emerald-500" : "bg-red-500")}>{toast.msg}</div>
        )}
      </div>
    </div>
  );
}
