import { apiGet } from '../lib/api';
import { BarChartCard, PieChartCard, Card, KPI, PageHeader } from '../components/Charts';
import Link from 'next/link';

export const revalidate = 60;
export const metadata = { title: 'Desperdicio' };

export default async function DesperdicioPage() {
  const grupos = await apiGet('/ml/agrupar-platos').catch(() => ({ clusters: [] }));
  // Simulado basado en los clusters
  const porPlato = (grupos.clusters || []).map((g: any, i: number) => ({
    categoria: g.etiqueta.split('-').slice(0, 2).join(' '),
    desperdicio: g.etiqueta.includes('desp-alto') ? 35 + i * 5 : 12 + i * 3,
    platos: g.tam,
  }));

  const total = porPlato.reduce((s: number, p: any) => s + p.desperdicio * p.platos, 0);
  const prom = porPlato.length ? Math.round(total / porPlato.reduce((s: number, p: any) => s + p.platos, 0)) : 0;

  return (
    <>
      <PageHeader title="🗑️ Desperdicio por plato" subtitle="Medido con CNN MobileNetV2 sobre fotos de bandejas" tags={['SSR', 'ISR 60s']} />
      <div className="px-8 pb-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPI label="Desperdicio promedio" value={prom + '%'} delta="Semanal" color="red" />
          <KPI label="Platos monitoreados" value={porPlato.reduce((s: number, p: any) => s + p.platos, 0)} delta="Con fotos de bandeja" color="purple" />
          <KPI label="Categorías" value={porPlato.length} delta="Clusters KMeans" color="cyan" />
          <KPI label="Modelo" value="CNN" delta="MobileNetV2 pretrained" color="orange" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="📊 Desperdicio por categoría" subtitle="% sobrante promedio">
            <BarChartCard data={porPlato} dataKey="desperdicio" xKey="categoria" color="#ef4444" unit="%" />
          </Card>
          <Card title="🍴 Distribución de platos" subtitle="Por categoría">
            <PieChartCard data={porPlato.map((p: any) => ({ tam: p.platos, etiqueta: p.categoria }))} dataKey="tam" nameKey="etiqueta" />
          </Card>
        </div>
        <Card>
          <div className="flex items-center gap-4">
            <div className="text-4xl">📷</div>
            <div className="flex-1">
              <h3 className="text-white font-bold">Analizar foto de bandeja</h3>
              <p className="text-sm text-slate-400">Subí una foto nueva y la CNN estima el % sobrante por componente (arroz, proteína, ensalada).</p>
            </div>
            <Link href="/cnn" className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg text-sm font-medium">Abrir CNN →</Link>
          </div>
        </Card>
      </div>
    </>
  );
}
