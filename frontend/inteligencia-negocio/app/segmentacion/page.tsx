import { apiGet } from '../lib/api';
import { PieChartCard, RadarChartCard, Card, KPI, PageHeader } from '../components/Charts';

export const revalidate = 300;
export const metadata = { title: 'Segmentación · KMeans' };

export default async function SegmentacionPage() {
  const [segm, grupos] = await Promise.all([
    apiGet('/ml/segmentar-comensales').catch(() => ({ clusters: [] })),
    apiGet('/ml/agrupar-platos').catch(() => ({ clusters: [] })),
  ]);
  const totalCom = (segm.clusters || []).reduce((s: number, x: any) => s + x.tam, 0);
  const totalPlatos = (grupos.clusters || []).reduce((s: number, x: any) => s + x.tam, 0);

  return (
    <>
      <PageHeader title="🧠 Segmentación · ML no supervisado" subtitle="KMeans clustering sobre comensales y platos" tags={['SSR', 'ISR 5min']} />
      <div className="px-8 pb-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPI label="Comensales" value={totalCom} delta="En clustering" color="purple" />
          <KPI label="Clusters" value={(segm.clusters || []).length} delta="K-Means k=4" color="cyan" />
          <KPI label="Platos agrupados" value={totalPlatos} delta="En clustering" color="orange" />
          <KPI label="Clusters platos" value={(grupos.clusters || []).length} delta="K-Means k=3" color="emerald" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="👥 Clusters de comensales" subtitle="Por frecuencia, horario, uso de beca">
            <PieChartCard data={segm.clusters || []} dataKey="tam" nameKey="etiqueta" />
          </Card>
          <Card title="🍲 Clusters de platos" subtitle="Por aceptación, costo y desperdicio">
            <PieChartCard data={grupos.clusters || []} dataKey="tam" nameKey="etiqueta" />
          </Card>
        </div>
        <Card title="📋 Detalle de segmentos" subtitle="Permite diseñar campañas dirigidas y detectar becarios inactivos">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-700 text-xs text-slate-400 uppercase">
              <th className="text-left p-3">Cluster</th>
              <th className="text-left p-3">Etiqueta</th>
              <th className="text-right p-3">Tamaño</th>
              <th className="text-right p-3">% del total</th>
              <th className="text-left p-3">Acción sugerida</th>
            </tr></thead>
            <tbody>
              {(segm.clusters || []).map((c: any) => {
                const pct = totalCom > 0 ? ((c.tam / totalCom) * 100).toFixed(1) : '0';
                const accion = c.etiqueta.includes('becario-inactivo') ? '🚨 Contactar al estudiante'
                  : c.etiqueta.includes('frecuente') ? '✓ Mantener'
                  : '📧 Campaña recordatoria';
                return (
                  <tr key={c.id} className="border-b border-slate-800">
                    <td className="p-3 font-mono text-cyan-400">#{c.id}</td>
                    <td className="p-3 text-white">{c.etiqueta}</td>
                    <td className="p-3 text-right text-slate-300">{c.tam}</td>
                    <td className="p-3 text-right text-slate-400">{pct}%</td>
                    <td className="p-3 text-sm text-slate-300">{accion}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
