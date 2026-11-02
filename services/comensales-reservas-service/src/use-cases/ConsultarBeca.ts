import { Injectable } from '@nestjs/common';
import { BecaRepo } from './ports';

@Injectable()
export class ConsultarBecaUseCase {
  constructor(private readonly becas: BecaRepo) {}
  async execute(estudianteId: string) {
    const beca = await this.becas.findActivaByEstudiante(estudianteId);
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
