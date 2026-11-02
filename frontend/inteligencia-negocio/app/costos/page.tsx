import { apiGet } from '../lib/api';
import { LineChartCard, BarChartCard, Card, KPI, PageHeader } from '../components/Charts';

export const revalidate = 60;
export const metadata = { title: 'Costo por ración' };

export default async function CostosPage() {
  const insumos = await apiGet('/insumos').catch(() => []);
  // Costeo simulado basado en stock minimo (proxy)
  const porInsumo = insumos.map((i: any) => ({
    nombre: i.nombre,
    costoUnit: Math.round(i.stockMinimo * 1.5 * 100) / 100,
  })).sort((a: any, b: any) => b.costoUnit - a.costoUnit).slice(0, 7);

  const tendencia = [
    { fecha: '2026-11-03', costo: 7.80 },
    { fecha: '2026-11-04', costo: 8.10 },
    { fecha: '2026-11-05', costo: 7.95 },
    { fecha: '2026-11-06', costo: 8.25 },
    { fecha: '2026-11-07', costo: 8.00 },
    { fecha: '2026-11-08', costo: 7.70 },
  ];
  const avg = Math.round(tendencia.reduce((s, d) => s + d.costo, 0) / tendencia.length * 100) / 100;

  return (
    <>
      <PageHeader title="💰 Costo por ración" subtitle="Costeo basado en insumos y producción" tags={['SSR', 'ISR 60s']} />
      <div className="px-8 pb-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPI label="Costo promedio" value={`${avg} Bs`} delta="Por ración · esta semana" color="orange" />
          <KPI label="Mínimo" value={`${Math.min(...tendencia.map(t => t.costo))} Bs`} delta="Mejor día" color="emerald" />
          <KPI label="Máximo" value={`${Math.max(...tendencia.map(t => t.costo))} Bs`} delta="Peor día" color="red" />
          <KPI label="Variación" value={`${((Math.max(...tendencia.map(t => t.costo)) - Math.min(...tendencia.map(t => t.costo))) * 100 / avg).toFixed(0)}%`} delta="Rango semanal" color="cyan" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="📈 Tendencia costo/ración" subtitle="Últimos 7 días">
            <LineChartCard data={tendencia} dataKey="costo" xKey="fecha" color="#f59e0b" />
          </Card>
          <Card title="🥕 Top insumos por costo" subtitle="Costo unitario (Bs)">
            <BarChartCard data={porInsumo} dataKey="costoUnit" xKey="nombre" color="#8b5cf6" />
          </Card>
        </div>
      </div>
    </>
  );
}
