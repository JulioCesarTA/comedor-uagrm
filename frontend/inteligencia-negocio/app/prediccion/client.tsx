'use client';
// Client Component que llama a un SERVER ACTION — mezcla server+client exclusiva de Next.js
import { useState, useTransition } from 'react';
import { predecirDemanda } from '../actions';
import { Card } from '../components/Charts';

export function PredecirCliente() {
  const [plato, setPlato] = useState('plato-pollo');
  const [feriado, setFeriado] = useState(false);
  const [res, setRes] = useState<any>(null);
  const [pending, startTransition] = useTransition();

  const predecir = () => startTransition(async () => {
    const r = await predecirDemanda(plato, feriado);
    setRes(r);
  });

  return (
    <Card title="🔮 Predictor interactivo" subtitle="Llama a un Server Action — se ejecuta en el servidor sin API route">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Plato</label>
          <input value={plato} onChange={e => setPlato(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg text-sm" />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm text-slate-300 mt-6">
            <input type="checkbox" checked={feriado} onChange={e => setFeriado(e.target.checked)} className="rounded" />
            Es feriado
          </label>
        </div>
        <button onClick={predecir} disabled={pending}
          className="py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg disabled:opacity-50">
          {pending ? 'Prediciendo…' : '▶ Predecir'}
        </button>
      </div>
      {res && (
        <div className="mt-4 bg-slate-900 rounded-lg p-4 flex items-center gap-4">
          <div className="text-4xl">🎯</div>
          <div className="flex-1">
            <div className="text-xs text-slate-400 uppercase">Raciones estimadas</div>
            <div className="text-3xl font-bold text-cyan-400">{res.racionesEstimadas}</div>
          </div>
          <code className="text-xs text-slate-500 font-mono">{res.platoId}</code>
        </div>
      )}
    </Card>
  );
}
