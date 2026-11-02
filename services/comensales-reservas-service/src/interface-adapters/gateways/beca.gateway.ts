import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BecaRepo } from '../../use-cases/ports';
import { Beca, TipoBeca } from '../../entities/Beca';
import { BecaOrm } from '../../infrastructure/database/postgres/beca.entity';

@Injectable()
export class BecaGateway extends BecaRepo {
  constructor(@InjectRepository(BecaOrm) private readonly repo: Repository<BecaOrm>) { super(); }
  async findActivaByEstudiante(estId: string): Promise<Beca | null> {
    const hoy = new Date();
    const o = await this.repo.createQueryBuilder('b')
      .where('b.estudianteId = :id', { id: estId })
      .andWhere('b.vigenteDesde <= :hoy AND b.vigenteHasta >= :hoy', { hoy })
      .getOne();
    return o ? new Beca(o.id, o.estudianteId, o.tipo as TipoBeca, o.cupoRacionesMes,
      o.racionesUsadasMes, o.vigenteDesde, o.vigenteHasta) : null;
  }
  async save(b: Beca): Promise<Beca> {
    await this.repo.save({
      id: b.id, estudianteId: b.estudianteId, tipo: b.tipo,
      cupoRacionesMes: b.cupoRacionesMes, racionesUsadasMes: b.racionesUsadasMes,
      vigenteDesde: b.vigenteDesde, vigenteHasta: b.vigenteHasta,
    });
    return b;
  }
  async listar(): Promise<Beca[]> {
    const rows = await this.repo.find();
    return rows.map(o => new Beca(o.id, o.estudianteId, o.tipo as TipoBeca,
      o.cupoRacionesMes, o.racionesUsadasMes, o.vigenteDesde, o.vigenteHasta));
  }
}
