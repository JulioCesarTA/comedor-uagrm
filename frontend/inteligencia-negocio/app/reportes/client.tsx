'use client';
import { useState, useTransition } from 'react';
import { pedirReporte } from '../actions';
import { Card } from '../components/Charts';

const ejemplos = [
  '¿cuánto desperdicio hubo esta semana?',
  'becarios inactivos del último mes',
  '¿cuántas raciones se sirvieron?',
  'insumos con stock bajo',
];

export function ReportesClient() {
  const [pregunta, setPregunta] = useState('¿cuánto desperdicio hubo esta semana?');
  const [rol, setRol] = useState('administrador');
  const [res, setRes] = useState<any>(null);
  const [pending, startTransition] = useTransition();

  const pedir = () => startTransition(async () => {
    const r = await pedirReporte(pregunta, rol);
    setRes(r);
  });

  return (
    <div className="space-y-6">
      <Card title="🤖 LLM local sobre consultas predefinidas" subtitle="Server Action corre el matcher en el servidor y devuelve plantilla + confianza">
        <label className="block text-xs text-slate-400 uppercase mb-2 font-medium">Pregunta en lenguaje natural</label>
        <textarea value={pregunta} onChange={e => setPregunta(e.target.value)} rows={2}
          className="w-full p-3 bg-slate-900 text-white rounded-lg border border-slate-700 focus:outline-none focus:border-purple-500" />
        <div className="flex gap-2 mt-3 flex-wrap">
          {ejemplos.map(e => (
            <button key={e} onClick={() => setPregunta(e)}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-full text-xs transition">
              {e}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-4">
          <label className="text-xs text-slate-400 uppercase font-medium">Rol</label>
          <select value={rol} onChange={e => setRol(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 text-white rounded-lg text-sm">
            <option>administrador</option>
            <option>nutricionista</option>
            <option>cocina_almacen</option>
          </select>
          <div className="flex-1"></div>
          <button onClick={pedir} disabled={pending}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold rounded-lg disabled:opacity-50">
            {pending ? '⚡ Procesando…' : '▶ Generar reporte'}
          </button>
        </div>
      </Card>
      {res && !res.error && (
        <>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs text-slate-400 uppercase font-medium">Query elegida</div>
                <div className="text-xl font-bold text-cyan-400 font-mono mt-1">{res.plantilla_elegida}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Confianza</div>
                <div className="text-2xl font-bold text-emerald-400">{(res.confianza_llm * 100).toFixed(0)}%</div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {Object.entries(res.scores_otros_queries || {}).map(([k, v]: any) => (
                <div key={k} className={"bg-slate-900 rounded-lg p-3 " + (k === res.plantilla_elegida ? "border border-purple-500/50" : "")}>
                  <div className="text-slate-400 truncate">{k}</div>
                  <div className="text-white font-mono mt-1">{(v * 100).toFixed(0)}%</div>
                </div>
              ))}
            </div>
          </Card>
          <Card title="📅 Parámetros detectados">
            <pre className="p-3 bg-slate-900 rounded-lg text-xs text-cyan-400">{JSON.stringify(res.parametros_detectados, null, 2)}</pre>
          </Card>
          <Card title="📊 Resultado">
            {res.filas?.length ? (
              <pre className="p-3 bg-slate-900 rounded-lg text-xs text-emerald-400 overflow-auto max-h-80">{JSON.stringify(res.filas, null, 2)}</pre>
            ) : (
              <div className="text-slate-500 text-sm text-center py-6">La query no devolvió filas (BD CQRS aún vacía en demo).</div>
            )}
          </Card>
        </>
      )}
      {res?.error && (
        <Card>
          <div className="text-red-400 font-bold">❌ {res.error}</div>
          <div className="text-xs text-slate-400 mt-2">Rol <code className="text-cyan-400">{res.rol}</code> no autorizado para query <code className="text-cyan-400">{res.plantilla_elegida}</code></div>
        </Card>
      )}
    </div>
  );
}
