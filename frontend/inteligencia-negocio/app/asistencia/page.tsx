import { apiGet } from '../lib/api';
import { LineChartCard, BarChartCard, Card, KPI, PageHeader } from '../components/Charts';

export const revalidate = 60;
export const metadata = { title: 'Asistencia' };

export default async function AsistenciaPage() {
  const alm = await apiGet('/menus/semana/ALMUERZO').catch(() => []);
  const serie = alm.map((m: any) => {
    const porc = Object.values(m.porciones || {});
    const cupo = porc.reduce((s: number, p: any) => s + p.cupo, 0);
    const apartadas = porc.reduce((s: number, p: any) => s + p.apartadas, 0);
    const asistencia = cupo > 0 ? Math.round((apartadas / cupo) * 100) : 0;
    return { fecha: m.fecha, cupo, apartadas, asistencia };
  });

  const promAsist = serie.length ? Math.round(serie.reduce((s: number, d: any) => s + d.asistencia, 0) / serie.length) : 0;

  return (
    <>
      <PageHeader title="👥 Asistencia" subtitle="Porcentaje de ocupación del cupo publicado" tags={['SSR', 'ISR 60s']} />
      <div className="px-8 pb-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPI label="Asistencia promedio" value={promAsist + '%'} delta="Almuerzo esta semana" color="purple" />
          <KPI label="Cupo total" value={serie.reduce((s: number, d: any) => s + d.cupo, 0)} delta="Raciones ofertadas" color="cyan" />
          <KPI label="Reservadas" value={serie.reduce((s: number, d: any) => s + d.apartadas, 0)} delta="Confirmadas" color="orange" />
          <KPI label="Disponibles" value={serie.reduce((s: number, d: any) => s + (d.cupo - d.apartadas), 0)} delta="Sin reservar" color="emerald" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="📈 Tendencia de asistencia" subtitle="Porcentaje por día">
            <LineChartCard data={serie} dataKey="asistencia" xKey="fecha" color="#06b6d4" />
          </Card>
          <Card title="📊 Cupo vs reservadas" subtitle="Comparación por día">
            <BarChartCard data={serie} dataKey="apartadas" xKey="fecha" color="#f97316" />
          </Card>
        </div>
      </div>
    </>
  );
}
