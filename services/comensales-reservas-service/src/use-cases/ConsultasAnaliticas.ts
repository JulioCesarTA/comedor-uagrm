import { BecaRepo, EstudianteRepo, ReservaRepo } from './ports';

/** Lecturas planas (solo consulta) para el generador de reportes: reservas y becas con los datos del estudiante. */
export class ListarReservasAnaliticasUseCase {
  constructor(private readonly reservas: ReservaRepo, private readonly estudiantes: EstudianteRepo) {}

  async execute() {
    const porId = new Map((await this.estudiantes.listar()).map(e => [e.id, e]));
    return (await this.reservas.listarTodas()).map(r => {
      const e = porId.get(r.estudianteId);
      return {
        id: r.id, fecha: new Date(r.fecha).toISOString().slice(0, 10), turno: r.turno, plato: r.platoId, estado: r.estado,
        creada: r.createdAt, matricula: e?.registroUniv ?? null, estudiante: e?.nombre ?? null, menuId: r.menuId,
      };
    });
  }
}

export class ListarBecasAnaliticasUseCase {
  constructor(private readonly becas: BecaRepo, private readonly estudiantes: EstudianteRepo) {}

  async execute() {
    const porId = new Map((await this.estudiantes.listar()).map(e => [e.id, e]));
    return (await this.becas.listarTodas()).map(b => {
      const e = porId.get(b.estudianteId);
      return {
        id: b.id, matricula: e?.registroUniv ?? null, estudiante: e?.nombre ?? null, tipo: b.tipo,
        cupoMensual: b.cupoRacionesMes, usadas: b.racionesUsadasMes, desde: b.vigenteDesde, hasta: b.vigenteHasta,
      };
    });
  }
}
