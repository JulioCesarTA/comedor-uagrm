'use server';
// SERVER ACTIONS — feature exclusiva de Next.js
// Las llamo desde Client Components y se ejecutan en el servidor sin API route.
import { revalidatePath } from 'next/cache';
import { apiPost, apiGet } from './lib/api';

export async function runAgente(nombre: string, objetivo: string, contexto: any = {}) {
  const r = await apiPost(`/agentes/${nombre}`, { objetivo, contexto });
  return r;
}

export async function pedirReporte(pregunta: string, rol: string = 'administrador') {
  const r = await apiPost('/reportes/pedir', { pregunta, rol_usuario: rol, formato: 'json' });
  return r;
}

export async function predecirDemanda(platoId: string, feriado: boolean = false) {
  return apiPost('/ml/demanda', { fecha: '2026-11-10', plato_id: platoId, es_feriado: feriado });
}

export async function predecirNoShow(turno: string) {
  return apiPost('/ml/no-presentacion', { estudiante_id: 'avg', plato_id: 'any', turno });
}

export async function refreshDashboard() {
  revalidatePath('/');
}
