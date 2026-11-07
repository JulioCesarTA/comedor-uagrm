import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  AsignarBecaUseCase, CrearEstudianteUseCase, ListarEstudiantesUseCase, ObtenerEstudianteUseCase,
} from '../../use-cases/GestionarEstudiantes';
import { TipoBeca } from '../../entities/Beca';

@Controller('estudiantes')
export class EstudiantesController {
  constructor(
    private readonly listarEstudiantes: ListarEstudiantesUseCase,
    private readonly crearEstudiante: CrearEstudianteUseCase,
    private readonly obtenerEstudiante: ObtenerEstudianteUseCase,
    private readonly asignarBeca: AsignarBecaUseCase,
  ) {}

  @Get()
  listar() { return this.listarEstudiantes.execute(); }

  @Post()
  crear(@Body() b: { registroUniv: string; nombre: string; email: string; telefono?: string }) {
    return this.crearEstudiante.execute(b);
  }

  @Get(':id')
  uno(@Param('id') id: string) { return this.obtenerEstudiante.execute(id); }

  // POST /estudiantes/:id/beca { tipo, mesesVigencia?, cupoRacionesMes? }
  @Post(':id/beca')
  async beca(@Param('id') id: string, @Body() b: { tipo: TipoBeca; mesesVigencia?: number; cupoRacionesMes?: number }) {
    return { ok: true, beca: await this.asignarBeca.execute(id, b) };
  }
}
