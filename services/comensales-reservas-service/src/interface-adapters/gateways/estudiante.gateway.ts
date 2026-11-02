import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstudianteRepo } from '../../use-cases/ports';
import { Estudiante } from '../../entities/Estudiante';
import { EstudianteOrm } from '../../infrastructure/database/postgres/estudiante.entity';

@Injectable()
export class EstudianteGateway extends EstudianteRepo {
  constructor(@InjectRepository(EstudianteOrm) private readonly repo: Repository<EstudianteOrm>) { super(); }

  async findById(id: string): Promise<Estudiante | null> {
    const o = await this.repo.findOneBy({ id });
    return o ? new Estudiante(o.id, o.registroUniv, o.nombre, o.email, o.telefono) : null;
  }
  async findByRegistro(registro: string): Promise<Estudiante | null> {
    const o = await this.repo.findOneBy({ registroUniv: registro });
    return o ? new Estudiante(o.id, o.registroUniv, o.nombre, o.email, o.telefono) : null;
  }
  async save(e: Estudiante): Promise<Estudiante> {
    await this.repo.save({
      id: e.id, registroUniv: e.registroUniv, nombre: e.nombre, email: e.email, telefono: e.telefono,
    });
    return e;
  }
  async listar(): Promise<Estudiante[]> {
    const rows = await this.repo.find({ order: { nombre: 'ASC' } });
    return rows.map(o => new Estudiante(o.id, o.registroUniv, o.nombre, o.email, o.telefono));
  }
}
