import { v4 as uuid } from 'uuid';
import { BecaRepo, EstudianteRepo } from './ports';
import { ResolverEstudianteUseCase } from './ResolverEstudiante';
import { Estudiante } from '../entities/Estudiante';
import { Beca, TipoBeca } from '../entities/Beca';
import { NoEncontradoError } from '../entities/errores';

export class ListarEstudiantesUseCase {
  constructor(private readonly estudiantes: EstudianteRepo) {}
  execute(): Promise<Estudiante[]> { return this.estudiantes.listar(); }
}

export class ObtenerEstudianteUseCase {
  constructor(private readonly resolver: ResolverEstudianteUseCase) {}
  execute(ref: string): Promise<Estudiante | null> { return this.resolver.execute(ref); }
}

/** Da de alta un estudiante; si ya existe esa matrícula, devuelve el existente (idempotente). */
export class CrearEstudianteUseCase {
  constructor(private readonly estudiantes: EstudianteRepo) {}

  async execute(d: { registroUniv: string; nombre: string; email: string; telefono?: string }): Promise<Estudiante> {
    const existente = await this.estudiantes.findByRegistro(d.registroUniv);
    if (existente) return existente;
    return this.estudiantes.save(new Estudiante(uuid(), d.registroUniv, d.nombre, d.email, d.telefono));
  }
}

const CUPO_POR_TIPO: Record<TipoBeca, number> = { completa: 60, media: 30, parcial: 15 };

export class AsignarBecaUseCase {
  constructor(private readonly becas: BecaRepo, private readonly resolver: ResolverEstudianteUseCase) {}

  async execute(ref: string, d: { tipo: TipoBeca; mesesVigencia?: number; cupoRacionesMes?: number }): Promise<Beca> {
    const est = await this.resolver.execute(ref);
    if (!est) throw new NoEncontradoError(`Estudiante no existe: ${ref}`);
    const desde = new Date();
    const hasta = new Date(desde);
    hasta.setMonth(hasta.getMonth() + (d.mesesVigencia || 12));
    return this.becas.save(new Beca(uuid(), est.id, d.tipo, d.cupoRacionesMes ?? CUPO_POR_TIPO[d.tipo] ?? 30, 0, desde, hasta));
  }
}
