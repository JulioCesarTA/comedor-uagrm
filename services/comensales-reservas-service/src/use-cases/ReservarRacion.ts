import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { EstudianteRepo, ReservaRepo, EventBusPort } from './ports';
import { Reserva } from '../entities/Reserva';
import { Estudiante } from '../entities/Estudiante';
import { Turno } from '../entities/Turno';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Paso 1 de la Saga 1: crea una reserva en estado `pendiente`.
 */
@Injectable()
export class ReservarRacionUseCase {
  constructor(
    private readonly estudiantes: EstudianteRepo,
    private readonly reservas: ReservaRepo,
    private readonly bus: EventBusPort,
  ) {}

  /** Si estudianteId es UUID → busca por ID. Si no → busca/crea por registroUniv (idempotente). */
  private async resolveEstudiante(ref: string): Promise<Estudiante> {
    if (UUID_RE.test(ref)) {
      const e = await this.estudiantes.findById(ref);
      if (!e) throw new Error(`Estudiante no existe: ${ref}`);
      return e;
    }
    // ref es username/registro: busca o crea
    let e = await this.estudiantes.findByRegistro(ref);
    if (!e) {
      e = new Estudiante(uuid(), ref, ref, `${ref}@uagrm.edu.bo`);
      await this.estudiantes.save(e);
    }
    return e;
  }

  async execute(input: {
    estudianteId: string;
    menuId: string;
    platoId: string;
    fecha: string;
    turno: Turno;
    sagaId?: string;
  }): Promise<Reserva> {
    const est = await this.resolveEstudiante(input.estudianteId);
    input.estudianteId = est.id;

    // Parseo robusto: acepta "YYYY-MM-DD" o ISO completo
    const fechaRaw = typeof input.fecha === 'string'
      ? (input.fecha.length === 10 ? input.fecha + 'T00:00:00Z' : input.fecha)
      : input.fecha;
    const fecha = new Date(fechaRaw);
    if (isNaN(fecha.getTime())) throw new Error(`fecha inválida: ${input.fecha}`);

    const r = new Reserva(
      uuid(),
      input.estudianteId,
      input.menuId,
      input.platoId,
      fecha,
      input.turno,
      'pendiente',
    );
    const saved = await this.reservas.save(r);
    await this.bus.publish('dominio-reservas', {
      type: 'ReservaCreadaEvent',
      sagaId: input.sagaId,
      reservaId: saved.id,
      estudianteId: saved.estudianteId,
      menuId: saved.menuId,
      platoId: saved.platoId,
    });
    return saved;
  }
}
