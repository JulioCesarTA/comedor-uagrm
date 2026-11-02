import { PageHeader } from '../components/Charts';
import { ReportesClient } from './client';

export const metadata = { title: 'Reportes generativos' };

export default function ReportesPage() {
  return (
    <>
      <PageHeader title="💬 Reportes generativos" subtitle="LLM local (TF-IDF + cosine) elige queries predefinidas · nunca escribe SQL libre" tags={['Server Actions', 'LLM local']} />
      <div className="px-8 pb-8">
        <ReportesClient />
      </div>
    </>
  );
}
