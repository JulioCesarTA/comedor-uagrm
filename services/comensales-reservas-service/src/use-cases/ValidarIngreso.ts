import { Injectable } from '@nestjs/common';
import { ReservaRepo } from './ports';

/** Punto de servicio: valida un QR y marca la reserva como consumida. */
@Injectable()
export class ValidarIngresoUseCase {
  constructor(private readonly reservas: ReservaRepo) {}

  async execute(qrCode: string): Promise<{ ok: boolean; reservaId?: string; motivo?: string }> {
    try {
      const payload = JSON.parse(Buffer.from(qrCode, 'base64').toString('utf-8'));
      const r = await this.reservas.findById(payload.reservaId);
      if (!r) return { ok: false, motivo: 'reserva no existe' };
      if (r.estado !== 'confirmada') return { ok: false, motivo: `estado=${r.estado}` };
      r.marcarConsumida();
      await this.reservas.save(r);
      return { ok: true, reservaId: r.id };
    } catch {
      return { ok: false, motivo: 'QR inválido' };
    }
  }
}
