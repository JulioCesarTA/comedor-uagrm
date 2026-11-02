import { Turno } from './Turno';

export type EstadoReserva = 'pendiente' | 'confirmada' | 'cancelada' | 'consumida';

export class Reserva {
  constructor(
    public readonly id: string,
    public readonly estudianteId: string,
    public readonly menuId: string,
    public readonly platoId: string,
    public readonly fecha: Date,
    public readonly turno: Turno,
    public estado: EstadoReserva,
    public qrCode?: string,
    public readonly createdAt: Date = new Date(),
  ) {}

  public confirmar(qr: string): void {
    if (this.estado !== 'pendiente') {
      throw new Error(`No se puede confirmar: estado=${this.estado}`);
    }
    this.estado = 'confirmada';
    this.qrCode = qr;
  }

  public cancelar(): void {
    if (this.estado === 'consumida')
      throw new Error('No se cancela una reserva ya consumida');
    this.estado = 'cancelada';
    this.qrCode = undefined;
  }

  public marcarConsumida(): void {
    if (this.estado !== 'confirmada')
      throw new Error('Solo reservas confirmadas se consumen');
    this.estado = 'consumida';
  }
}
