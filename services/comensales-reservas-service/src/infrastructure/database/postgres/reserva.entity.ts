import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('reservas')
export class ReservaOrm {
  @PrimaryColumn('uuid') id: string;
  @Index() @Column() estudianteId: string;
  @Column() menuId: string;
  @Column() platoId: string;
  @Column('date') fecha: Date;
  @Column() turno: string;
  @Column() estado: string;
  @Column({ type: 'text', nullable: true }) qrCode?: string;
  @CreateDateColumn() createdAt: Date;
}
