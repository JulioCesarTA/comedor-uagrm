import { BecaRepo } from './ports';
import { ResolverEstudianteUseCase } from './ResolverEstudiante';

export class ConsultarBecaUseCase {
  constructor(private readonly becas: BecaRepo, private readonly resolver: ResolverEstudianteUseCase) {}

  /** `ref` puede ser el UUID del estudiante o su matrícula/usuario (como llegan desde el portal y Telegram). */
  async execute(ref: string) {
    const est = await this.resolver.execute(ref);
    if (!est) return { tieneBeca: false };
    const beca = await this.becas.findActivaByEstudiante(est.id);
    if (!beca) return { tieneBeca: false };
    return {
      tieneBeca: true,
      tipo: beca.tipo,
      cupoRacionesMes: beca.cupoRacionesMes,
      racionesUsadasMes: beca.racionesUsadasMes,
      cubreHoy: beca.cubreRacion(),
      vigenteDesde: beca.vigenteDesde,
      vigenteHasta: beca.vigenteHasta,
    };
  }
}
