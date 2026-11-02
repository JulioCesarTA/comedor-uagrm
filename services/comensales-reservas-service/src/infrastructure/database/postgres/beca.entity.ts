import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('becas')
export class BecaOrm {
  @PrimaryColumn('uuid') id: string;
  @Index() @Column() estudianteId: string;
  @Column() tipo: string;
  @Column('int') cupoRacionesMes: number;
  @Column('int', { default: 0 }) racionesUsadasMes: number;
  @Column('timestamp') vigenteDesde: Date;
  @Column('timestamp') vigenteHasta: Date;
}
