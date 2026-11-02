// SERVER COMPONENT por default (sin 'use client')
// Los datos se fetchean en el servidor con ISR (revalidate: 60s)
import { Suspense } from 'react';
import { apiGet, apiPost } from './lib/api';
import { AreaChartCard, BarChartCard, PieChartCard, Card, KPI, PageHeader } from './components/Charts';

export const revalidate = 60;  // ISR: regenera página cada 60s (exclusivo Next.js)

export const metadata = { title: 'Dashboard · overview' };

async function getData() {
  const [segm, grupos, stockBajo, demandas, noShows] = await Promise.all([
    apiGet('/ml/segmentar-comensales', 300).catch(() => ({ clusters: [] })),
    apiGet('/ml/agrupar-platos', 300).catch(() => ({ clusters: [] })),
    apiGet('/insumos/stock-bajo', 30).catch(() => []),
    Promise.all(['A', 'B', 'C', 'D', 'E', 'F'].map(c =>
      apiPost('/ml/demanda', { fecha: '2026-11-10', plato_id: `plato-${c}`, es_feriado: false })
        .then((r: any) => ({ plato: `Plato ${c}`, raciones: r.racionesEstimadas }))
        .catch(() => ({ plato: `Plato ${c}`, raciones: 0 }))
    )),
    Promise.all(['DESAYUNO', 'ALMUERZO', 'CENA'].map(t =>
      apiPost('/ml/no-presentacion', { estudiante_id: 'avg', plato_id: 'any', turno: t })
        .then((r: any) => ({ turno: t, prob: Math.round(r.probNoShow * 100) }))
        .catch(() => ({ turno: t, prob: 0 }))
    )),
  ]);
  return { segm: segm.clusters || [], grupos: grupos.clusters || [], stockBajo, demandas, noShows };
}

// Suspense boundary: cada sección carga por streaming (feature de Next.js)
async function Kpis() {
  const d = await getData();
  const totalCom = d.segm.reduce((s: number, x: any) => s + x.tam, 0);
  const totalRac = d.demandas.reduce((s: number, x: any) => s + x.raciones, 0);
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <KPI label="Comensales segmentados" value={totalCom} delta="KMeans · 1000 muestras" color="purple" />
      <KPI label="Grupos de platos" value={d.grupos.reduce((s: number, x: any) => s + x.tam, 0)} delta="Clustering sklearn" color="cyan" />
      <KPI label="Raciones estimadas" value={totalRac} delta="RandomForest" color="orange" />
      <KPI label="Insumos en alerta" value={d.stockBajo.length} delta={d.stockBajo.length ? '⚠ atención' : '✓ OK'} color={d.stockBajo.length ? 'red' : 'emerald'} />
    </div>
  );
}

async function Dashboards() {
  const d = await getData();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card title="📈 Predicción de demanda" subtitle="Random Forest · 500 muestras">
        <AreaChartCard data={d.demandas} dataKey="raciones" xKey="plato" />
      </Card>
      <Card title="👥 Segmentación de comensales" subtitle="K-Means sobre 1000 estudiantes">
        <PieChartCard data={d.segm} dataKey="tam" nameKey="etiqueta" />
      </Card>
      <Card title="📉 Probabilidad no-show" subtitle="Logistic Regression por turno">
        <BarChartCard data={d.noShows} dataKey="prob" xKey="turno" unit="%" />
      </Card>
      <Card title="🍲 Grupos de platos" subtitle="K-Means · aceptación · costo · desperdicio">
        <div className="space-y-3">
          {d.grupos.map((g: any, i: number) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ background: ['#8b5cf6', '#06b6d4', '#f97316'][i % 3] }}></div>
                <span className="text-sm text-white">{g.etiqueta}</span>
              </div>
              <span className="text-sm text-slate-400">{g.tam} platos</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <PageHeader title="📊 Dashboard general" subtitle="Overview del comedor · datos en tiempo real" tags={['SSR', 'ISR 60s', 'Streaming']} />
      <div className="px-8 pb-8 space-y-6">
        <Suspense fallback={<div className="h-32 bg-slate-800/30 rounded-xl animate-pulse" />}>
          {/* @ts-expect-error async server component */}
          <Kpis />
        </Suspense>
        <Suspense fallback={<div className="h-96 bg-slate-800/30 rounded-xl animate-pulse" />}>
          {/* @ts-expect-error async server component */}
          <Dashboards />
        </Suspense>
      </div>
    </>
  );
}
