import { ReservaRepo, EventBusPort } from './ports';
import { NoEncontradoError } from '../entities/errores';

export class CancelarReservaUseCase {
  constructor(private readonly reservas: ReservaRepo, private readonly bus: EventBusPort) {}
  async execute(reservaId: string): Promise<void> {
    const r = await this.reservas.findById(reservaId);
    if (!r) throw new NoEncontradoError('Reserva no existe');
    r.cancelar();
    await this.reservas.save(r);
    await this.bus.publish('dominio-reservas', {
      type: 'ReservaCanceladaEvent',
      reservaId: r.id,
      estudianteId: r.estudianteId,
    });
  }
}
