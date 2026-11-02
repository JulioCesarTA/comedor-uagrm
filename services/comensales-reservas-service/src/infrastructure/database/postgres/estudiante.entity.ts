import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('estudiantes')
export class EstudianteOrm {
  @PrimaryColumn('uuid') id: string;
  @Column({ unique: true }) registroUniv: string;
  @Column() nombre: string;
  @Column() email: string;
  @Column({ nullable: true }) telefono?: string;
}
