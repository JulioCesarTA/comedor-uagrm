import { PageHeader } from '../components/Charts';
import { AgentesCliente } from './client';

export const metadata = { title: 'Agentes IA' };

const agentes = [
  { k: 'monitor-comedor', t: 'Monitor del comedor', e: '📡', d: 'Detecta caídas de asistencia, platos con mucho desperdicio y costo por ración fuera de rango.', tech: 'sklearn analytics + MCP' },
  { k: 'planificador-menu', t: 'Planificador menú', e: '🧠', d: 'Propone menú semanal usando predicción ML + stock disponible + insumos por vencer.', tech: 'RandomForest + MCP' },
  { k: 'inventario-compras', t: 'Inventario + compras', e: '📦', d: 'Detecta stock bajo y lotes por vencer, arma órdenes de compra. Requiere confirmación humana.', tech: 'MCP tools · HITL' },
  { k: 'atencion-estudiante', t: 'Atención al estudiante', e: '💬', d: 'LLM local TF-IDF para clasificar intents (menú / reserva / beca) y consultar via MCP.', tech: 'TF-IDF + cosine' },
];

export default function AgentesPage() {
  return (
    <>
      <PageHeader title="🤖 Agentes IA · misiones autónomas" subtitle="Server Actions ejecutan los agentes en el servidor" tags={['Server Actions']} />
      <div className="px-8 pb-8">
        <AgentesCliente agentes={agentes} />
      </div>
    </>
  );
}
