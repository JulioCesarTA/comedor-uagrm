export type TipoBeca = 'completa' | 'media' | 'parcial';

export class Beca {
  constructor(
    public readonly id: string,
    public readonly estudianteId: string,
    public readonly tipo: TipoBeca,
    public readonly cupoRacionesMes: number,
    public readonly racionesUsadasMes: number,
    public readonly vigenteDesde: Date,
    public readonly vigenteHasta: Date,
  ) {}

  public estaVigente(hoy: Date = new Date()): boolean {
    return hoy >= this.vigenteDesde && hoy <= this.vigenteHasta;
  }

  public tieneCupo(): boolean {
    return this.racionesUsadasMes < this.cupoRacionesMes;
  }

  public cubreRacion(hoy: Date = new Date()): boolean {
    return this.estaVigente(hoy) && this.tieneCupo();
  }
}
