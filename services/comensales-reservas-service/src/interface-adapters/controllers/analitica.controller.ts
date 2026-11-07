import { Controller, Get } from '@nestjs/common';
import { ListarBecasAnaliticasUseCase, ListarReservasAnaliticasUseCase } from '../../use-cases/ConsultasAnaliticas';

/** Lecturas planas (solo consulta) para el generador de reportes. */
@Controller('analitica')
export class AnaliticaController {
  constructor(
    private readonly reservas: ListarReservasAnaliticasUseCase,
    private readonly becas: ListarBecasAnaliticasUseCase,
  ) {}

  @Get('reservas')
  listarReservas() { return this.reservas.execute(); }

  @Get('becas')
  listarBecas() { return this.becas.execute(); }
}
