import { ReservaRepo, EventBusPort, QrGeneratorPort } from './ports';
import { NoEncontradoError } from '../entities/errores';

/** Paso 4 de la Saga 1: confirma y emite QR. */
export class ConfirmarReservaUseCase {
  constructor(
    private readonly reservas: ReservaRepo,
    private readonly bus: EventBusPort,
    private readonly qr: QrGeneratorPort,
  ) {}

  async execute(reservaId: string): Promise<{ reservaId: string; qr: string }> {
    const r = await this.reservas.findById(reservaId);
    if (!r) throw new NoEncontradoError('Reserva no existe');
    const qr = await this.qr.generar({
      reservaId: r.id,
      estudianteId: r.estudianteId,
      fecha: r.fecha,
      turno: r.turno,
    });
    r.confirmar(qr);
    await this.reservas.save(r);
    await this.bus.publish('dominio-reservas', {
      type: 'ReservaConfirmadaEvent',
      reservaId: r.id,
      estudianteId: r.estudianteId,
    });
    return { reservaId: r.id, qr };
  }
}
