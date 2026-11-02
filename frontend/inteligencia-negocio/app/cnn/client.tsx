'use client';
import { useState } from 'react';
import { Card } from '../components/Charts';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://44.252.104.3:8080';

export function CNNClient() {
  const [desp, setDesp] = useState<any>(null);
  const [cal, setCal] = useState<any>(null);
  const [prevDesp, setPrevDesp] = useState<string>('');
  const [prevCal, setPrevCal] = useState<string>('');
  const [loading, setLoading] = useState<string>('');

  const upload = async (type: 'desp' | 'cal', file: File) => {
    setLoading(type);
    const url = URL.createObjectURL(file);
    if (type === 'desp') setPrevDesp(url); else setPrevCal(url);
    const fd = new FormData(); fd.append('file', file);
    const path = type === 'desp' ? '/ml/desperdicio' : '/ml/calidad-insumo';
    try {
      const r = await fetch(`${API}${path}`, { method: 'POST', body: fd });
      const data = await r.json();
      if (type === 'desp') setDesp(data); else setCal(data);
    } catch (e: any) {
      if (type === 'desp') setDesp({ error: e.message }); else setCal({ error: e.message });
    } finally { setLoading(''); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card title="🍽️ Desperdicio en bandeja" subtitle="Estima % sobrante por componente">
        <label className="block">
          <input type="file" accept="image/*" onChange={e => e.target.files && upload('desp', e.target.files[0])} className="hidden" />
          <span className="block w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg text-center cursor-pointer hover:shadow-xl">
            {loading === 'desp' ? 'Procesando con TensorFlow…' : '📤 Subir foto de bandeja'}
          </span>
        </label>
        {prevDesp && <img src={prevDesp} alt="bandeja" className="mt-4 rounded-lg max-h-56 mx-auto border border-slate-700" />}
        {desp && !desp.error && (
          <div className="mt-4 space-y-3">
            {Object.entries(desp.componentes || {}).map(([k, v]: any) => (
              <div key={k}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300 capitalize">{k}</span>
                  <span className="text-white font-semibold">{v}%</span>
                </div>
                <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-500 to-red-500" style={{ width: v + '%' }} />
                </div>
              </div>
            ))}
            <div className="text-xs text-emerald-400 mt-3">✓ {desp.modelo}</div>
          </div>
        )}
        {desp?.error && <div className="mt-4 text-sm text-red-400">❌ {desp.error}</div>}
      </Card>

      <Card title="🥬 Calidad de insumos" subtitle="Clasifica óptima / aceptable / rechazar">
        <label className="block">
          <input type="file" accept="image/*" onChange={e => e.target.files && upload('cal', e.target.files[0])} className="hidden" />
          <span className="block w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg text-center cursor-pointer hover:shadow-xl">
            {loading === 'cal' ? 'Procesando…' : '📤 Subir foto del insumo'}
          </span>
        </label>
        {prevCal && <img src={prevCal} alt="insumo" className="mt-4 rounded-lg max-h-56 mx-auto border border-slate-700" />}
        {cal && !cal.error && (
          <div className="mt-4 bg-slate-900 rounded-xl p-6 text-center">
            <div className="text-6xl mb-2">{cal.clase === 'optima' ? '🟢' : cal.clase === 'aceptable' ? '🟡' : '🔴'}</div>
            <div className="text-2xl font-bold text-white uppercase">{cal.clase}</div>
            <div className="text-xs text-slate-400 mt-2">Confianza: <span className="text-cyan-400 font-semibold">{(cal.confianza * 100).toFixed(0)}%</span></div>
            <div className="text-xs text-slate-500 mt-1">feature_norm: {cal.feature_norm}</div>
          </div>
        )}
      </Card>
    </div>
  );
}
