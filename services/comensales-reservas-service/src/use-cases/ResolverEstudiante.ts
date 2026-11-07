import { Estudiante } from '../entities/Estudiante';
import { EstudianteRepo } from './ports';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const esUuid = (ref: string): boolean => UUID_RE.test(ref);

/** Un estudiante se nombra por su ID (UUID) o por su matrícula/usuario: esta es la única regla que lo decide. */
export class ResolverEstudianteUseCase {
  constructor(private readonly estudiantes: EstudianteRepo) {}

  async execute(ref: string): Promise<Estudiante | null> {
    return esUuid(ref) ? this.estudiantes.findById(ref) : this.estudiantes.findByRegistro(ref);
  }
}
