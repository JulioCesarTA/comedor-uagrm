import { apiGet } from '../lib/api';
import { AreaChartCard, BarChartCard, Card, KPI, PageHeader } from '../components/Charts';

export const revalidate = 60;
export const metadata = { title: 'Raciones servidas' };

async function fetchMenus() {
  const [des, alm, cen] = await Promise.all([
    apiGet('/menus/semana/DESAYUNO').catch(() => []),
    apiGet('/menus/semana/ALMUERZO').catch(() => []),
    apiGet('/menus/semana/CENA').catch(() => []),
  ]);
  return { des, alm, cen };
}

export default async function RacionesPage() {
  const { des, alm, cen } = await fetchMenus();
  const porDia: Record<string, any> = {};
  const sumar = (lista: any[], turno: string) => {
    for (const m of lista) {
      const total = Object.values(m.porciones || {}).reduce((s: number, p: any) => s + (p.apartadas || 0), 0);
      porDia[m.fecha] = porDia[m.fecha] || { fecha: m.fecha, DESAYUNO: 0, ALMUERZO: 0, CENA: 0 };
      porDia[m.fecha][turno] = total;
    }
  };
  sumar(des, 'DESAYUNO'); sumar(alm, 'ALMUERZO'); sumar(cen, 'CENA');
  const serie = Object.values(porDia).sort((a: any, b: any) => a.fecha.localeCompare(b.fecha));
  const totalApartadas = serie.reduce((s: number, d: any) => s + d.DESAYUNO + d.ALMUERZO + d.CENA, 0);
  const totalMenus = des.length + alm.length + cen.length;
  const promDia = serie.length > 0 ? Math.round(totalApartadas / serie.length) : 0;
  const porTurno = [
    { turno: 'Desayuno', total: serie.reduce((s: number, d: any) => s + d.DESAYUNO, 0) },
    { turno: 'Almuerzo', total: serie.reduce((s: number, d: any) => s + d.ALMUERZO, 0) },
    { turno: 'Cena', total: serie.reduce((s: number, d: any) => s + d.CENA, 0) },
  ];

  return (
    <>
      <PageHeader title="🍽️ Raciones servidas" subtitle="Reservas confirmadas por día y turno" tags={['SSR', 'ISR 60s']} />
      <div className="px-8 pb-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPI label="Total raciones" value={totalApartadas} delta="Esta semana" color="purple" />
          <KPI label="Promedio diario" value={promDia} delta="Raciones/día" color="cyan" />
          <KPI label="Menús publicados" value={totalMenus} delta="D + A + C" color="orange" />
          <KPI label="Días con servicio" value={serie.length} delta="En el periodo" color="emerald" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="📈 Raciones por día" subtitle="Suma de los 3 turnos">
            <AreaChartCard data={serie} dataKey="ALMUERZO" xKey="fecha" />
          </Card>
          <Card title="🍴 Por turno" subtitle="Distribución semanal">
            <BarChartCard data={porTurno} dataKey="total" xKey="turno" />
          </Card>
        </div>
        <Card title="📋 Detalle por día">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-700 text-xs text-slate-400 uppercase">
                <th className="text-left p-3">Fecha</th>
                <th className="text-right p-3">Desayuno</th>
                <th className="text-right p-3">Almuerzo</th>
                <th className="text-right p-3">Cena</th>
                <th className="text-right p-3">Total</th>
              </tr></thead>
              <tbody>
                {serie.map((d: any) => (
                  <tr key={d.fecha} className="border-b border-slate-800">
                    <td className="p-3 font-mono text-slate-300">{d.fecha}</td>
                    <td className="p-3 text-right text-slate-300">{d.DESAYUNO}</td>
                    <td className="p-3 text-right text-slate-300">{d.ALMUERZO}</td>
                    <td className="p-3 text-right text-slate-300">{d.CENA}</td>
                    <td className="p-3 text-right text-white font-semibold">{d.DESAYUNO + d.ALMUERZO + d.CENA}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}
