import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { EstudianteGateway } from '../gateways/estudiante.gateway';
import { BecaGateway } from '../gateways/beca.gateway';
import { Estudiante } from '../../entities/Estudiante';
import { Beca, TipoBeca } from '../../entities/Beca';

const CUPO_POR_TIPO: Record<string, number> = { completa: 60, media: 30, parcial: 15 };

@Controller('estudiantes')
export class EstudiantesController {
  constructor(
    private readonly repo: EstudianteGateway,
    private readonly becas: BecaGateway,
  ) {}

  @Get()
  async listar() { return this.repo.listar(); }

  @Post()
  async crear(@Body() b: { registroUniv: string; nombre: string; email: string; telefono?: string }) {
    const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const existente = await this.repo.findByRegistro(b.registroUniv);
    if (existente) return existente;
    const e = new Estudiante(uuid(), b.registroUniv, b.nombre, b.email, b.telefono);
    return this.repo.save(e);
  }

  @Get(':id')
  async uno(@Param('id') id: string) {
    const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidV4.test(id) ? this.repo.findById(id) : this.repo.findByRegistro(id);
  }

  // POST /estudiantes/:id/beca { tipo, mesesVigencia?, cupoRacionesMes? }
  @Post(':id/beca')
  async asignarBeca(@Param('id') id: string, @Body() b: { tipo: TipoBeca; mesesVigencia?: number; cupoRacionesMes?: number }) {
    const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const est = uuidV4.test(id) ? await this.repo.findById(id) : await this.repo.findByRegistro(id);
    if (!est) throw new Error(`Estudiante no existe: ${id}`);
    const desde = new Date();
    const hasta = new Date(desde);
    hasta.setMonth(hasta.getMonth() + (b.mesesVigencia || 12));
    const beca = new Beca(
      uuid(), est.id, b.tipo,
      b.cupoRacionesMes ?? CUPO_POR_TIPO[b.tipo] ?? 30,
      0, desde, hasta,
    );
    await this.becas.save(beca);
    return { ok: true, beca };
  }
}
