import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstudianteOrm } from '../database/postgres/estudiante.entity';
import { BecaOrm } from '../database/postgres/beca.entity';
import { ReservaOrm } from '../database/postgres/reserva.entity';
import { EstudianteGateway } from '../../interface-adapters/gateways/estudiante.gateway';
import { BecaGateway } from '../../interface-adapters/gateways/beca.gateway';
import { ReservaGateway } from '../../interface-adapters/gateways/reserva.gateway';
import { SnsBus } from '../messaging/sns.bus';
import { QrGenerator } from '../qr/qr.generator';
import { ReservarRacionUseCase } from '../../use-cases/ReservarRacion';
import { ConfirmarReservaUseCase } from '../../use-cases/ConfirmarReserva';
import { CancelarReservaUseCase } from '../../use-cases/CancelarReserva';
import { ValidarIngresoUseCase } from '../../use-cases/ValidarIngreso';
import { ConsultarBecaUseCase } from '../../use-cases/ConsultarBeca';
import { EstudianteRepo, BecaRepo, ReservaRepo, EventBusPort, QrGeneratorPort } from '../../use-cases/ports';
import { ReservasController } from '../../interface-adapters/controllers/reservas.controller';
import { EstudiantesController } from '../../interface-adapters/controllers/estudiantes.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [EstudianteOrm, BecaOrm, ReservaOrm],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([EstudianteOrm, BecaOrm, ReservaOrm]),
  ],
  controllers: [ReservasController, EstudiantesController],
  providers: [
    EstudianteGateway, BecaGateway, ReservaGateway, SnsBus, QrGenerator,
    { provide: EstudianteRepo, useExisting: EstudianteGateway },
    { provide: BecaRepo, useExisting: BecaGateway },
    { provide: ReservaRepo, useExisting: ReservaGateway },
    { provide: EventBusPort, useExisting: SnsBus },
    { provide: QrGeneratorPort, useExisting: QrGenerator },
    ReservarRacionUseCase, ConfirmarReservaUseCase, CancelarReservaUseCase,
    ValidarIngresoUseCase, ConsultarBecaUseCase,
  ],
})
export class AppModule {}
