'use client';
import { useState, useTransition } from 'react';
import { runAgente } from '../actions';

export function AgentesCliente({ agentes }: { agentes: any[] }) {
  const [res, setRes] = useState<Record<string, any>>({});
  const [objetivos, setObjetivos] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const [cur, setCur] = useState('');

  const run = (k: string) => {
    setCur(k);
    const obj = objetivos[k] || 'Analizar y reportar hallazgos';
    startTransition(async () => {
      const r = await runAgente(k, obj, {});
      setRes(x => ({ ...x, [k]: r }));
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {agentes.map(a => (
        <div key={a.k} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-purple-500/50 transition">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-3xl shadow-lg">{a.e}</div>
            <div className="flex-1">
              <h3 className="font-bold text-white text-lg">{a.t}</h3>
              <p className="text-xs text-cyan-400 font-mono mt-1">{a.tech}</p>
            </div>
          </div>
          <p className="text-sm text-slate-400 mb-4 leading-relaxed">{a.d}</p>
          <input
            value={objetivos[a.k] || ''}
            onChange={e => setObjetivos(x => ({ ...x, [a.k]: e.target.value }))}
            placeholder="Misión personalizada (opcional)"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg text-sm mb-3"
          />
          <button onClick={() => run(a.k)} disabled={pending && cur === a.k}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg disabled:opacity-50 hover:shadow-xl transition">
            {pending && cur === a.k ? '⚡ Ejecutando misión…' : '▶ Ejecutar misión'}
          </button>
          {res[a.k] && (
            <pre className="mt-4 p-4 bg-slate-900 rounded-lg text-xs text-slate-300 max-h-80 overflow-auto font-mono border border-slate-700">
              {JSON.stringify(res[a.k], null, 2)}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}
