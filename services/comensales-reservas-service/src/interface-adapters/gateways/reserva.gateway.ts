import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReservaRepo } from '../../use-cases/ports';
import { EstadoReserva, Reserva } from '../../entities/Reserva';
import { Turno } from '../../entities/Turno';
import { ReservaOrm } from '../../infrastructure/database/postgres/reserva.entity';

@Injectable()
export class ReservaGateway extends ReservaRepo {
  constructor(@InjectRepository(ReservaOrm) private readonly repo: Repository<ReservaOrm>) { super(); }

  private toDomain(o: ReservaOrm): Reserva {
    return new Reserva(o.id, o.estudianteId, o.menuId, o.platoId, new Date(o.fecha),
      o.turno as Turno, o.estado as EstadoReserva, o.qrCode, o.createdAt);
  }
  async save(r: Reserva): Promise<Reserva> {
    const fechaStr = r.fecha instanceof Date && !isNaN(r.fecha.getTime())
      ? r.fecha.toISOString().slice(0, 10)
      : String(r.fecha).slice(0, 10);
    await this.repo.save({
      id: r.id, estudianteId: r.estudianteId, menuId: r.menuId, platoId: r.platoId,
      fecha: fechaStr as any, turno: r.turno, estado: r.estado, qrCode: r.qrCode,
    });
    return r;
  }
  async findById(id: string): Promise<Reserva | null> {
    const o = await this.repo.findOneBy({ id });
    return o ? this.toDomain(o) : null;
  }
  async findByEstudiante(estId: string): Promise<Reserva[]> {
    const os = await this.repo.find({ where: { estudianteId: estId } });
    return os.map(o => this.toDomain(o));
  }
}
