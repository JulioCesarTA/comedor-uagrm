import { Reserva } from './Reserva';
import { Turno } from './Turno';

describe('Reserva', () => {
  const nueva = () => new Reserva('r1', 'e1', 'm1', 'p1', new Date(), Turno.ALMUERZO, 'pendiente');

  it('confirma solo cuando está pendiente', () => {
    const r = nueva();
    r.confirmar('qr-token');
    expect(r.estado).toBe('confirmada');
    expect(r.qrCode).toBe('qr-token');
  });

  it('no confirma dos veces', () => {
    const r = nueva(); r.confirmar('q');
    expect(() => r.confirmar('otro')).toThrow();
  });

  it('cancela y limpia el QR', () => {
    const r = nueva(); r.confirmar('q'); r.cancelar();
    expect(r.estado).toBe('cancelada');
    expect(r.qrCode).toBeUndefined();
  });

  it('solo consume reservas confirmadas', () => {
    const r = nueva();
    expect(() => r.marcarConsumida()).toThrow();
    r.confirmar('q'); r.marcarConsumida();
    expect(r.estado).toBe('consumida');
  });
});
