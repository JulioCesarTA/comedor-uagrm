import { apiPost } from '../lib/api';
import { AreaChartCard, BarChartCard, Card, KPI, PageHeader } from '../components/Charts';
import { PredecirCliente } from './client';

export const revalidate = 60;
export const metadata = { title: 'Predicción de demanda' };

export default async function PrediccionPage() {
  const platos = ['plato-A', 'plato-B', 'plato-C', 'plato-D', 'plato-E', 'plato-F', 'plato-G', 'plato-H'];
  const demandas = await Promise.all(platos.map(id =>
    apiPost('/ml/demanda', { fecha: '2026-11-10', plato_id: id, es_feriado: false })
      .then((r: any) => ({ plato: id.slice(-1), raciones: r.racionesEstimadas }))
      .catch(() => ({ plato: id.slice(-1), raciones: 0 }))
  ));
  const noShows = await Promise.all(['DESAYUNO', 'ALMUERZO', 'CENA'].map(t =>
    apiPost('/ml/no-presentacion', { estudiante_id: 'avg', plato_id: 'any', turno: t })
      .then((r: any) => ({ turno: t, prob: Math.round(r.probNoShow * 100) }))
      .catch(() => ({ turno: t, prob: 0 }))
  ));
  const total = demandas.reduce((s, d) => s + d.raciones, 0);
  const avg = Math.round(total / demandas.length);

  return (
    <>
      <PageHeader title="📈 Predicción de demanda" subtitle="RandomForest + LogisticRegression sobre features sintéticos" tags={['SSR', 'ML real']} />
      <div className="px-8 pb-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPI label="Demanda total" value={total} delta="Suma de todos los platos" color="purple" />
          <KPI label="Promedio por plato" value={avg} delta="Raciones" color="cyan" />
          <KPI label="Platos analizados" value={demandas.length} delta="En este cálculo" color="orange" />
          <KPI label="Modelos activos" value={2} delta="RandomForest + LogReg" color="emerald" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="📊 Demanda estimada por plato" subtitle="RandomForest 500 muestras">
            <AreaChartCard data={demandas} dataKey="raciones" xKey="plato" />
          </Card>
          <Card title="📉 Probabilidad no-show por turno" subtitle="LogisticRegression">
            <BarChartCard data={noShows} dataKey="prob" xKey="turno" unit="%" color="#06b6d4" />
          </Card>
        </div>
        <PredecirCliente />
      </div>
    </>
  );
}
