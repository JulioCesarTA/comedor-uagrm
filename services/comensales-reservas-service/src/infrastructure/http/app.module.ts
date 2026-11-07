import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstudianteOrm } from '../database/postgres/estudiante.entity';
import { BecaOrm } from '../database/postgres/beca.entity';
import { ReservaOrm } from '../database/postgres/reserva.entity';
import { EstudianteGateway } from '../../interface-adapters/gateways/estudiante.gateway';
import { BecaGateway } from '../../interface-adapters/gateways/beca.gateway';
import { ReservaGateway } from '../../interface-adapters/gateways/reserva.gateway';
import { ErroresNegocioFilter } from '../../interface-adapters/filters/errores-negocio.filter';
import { SnsBus } from '../messaging/sns.bus';
import { QrGenerator } from '../qr/qr.generator';
import { ReservarRacionUseCase } from '../../use-cases/ReservarRacion';
import { ConfirmarReservaUseCase } from '../../use-cases/ConfirmarReserva';
import { CancelarReservaUseCase } from '../../use-cases/CancelarReserva';
import { ValidarIngresoUseCase } from '../../use-cases/ValidarIngreso';
import { ConsultarBecaUseCase } from '../../use-cases/ConsultarBeca';
import { ResolverEstudianteUseCase } from '../../use-cases/ResolverEstudiante';
import {
  AsignarBecaUseCase, CrearEstudianteUseCase, ListarEstudiantesUseCase, ObtenerEstudianteUseCase,
} from '../../use-cases/GestionarEstudiantes';
import { ListarBecasAnaliticasUseCase, ListarReservasAnaliticasUseCase } from '../../use-cases/ConsultasAnaliticas';
import { EstudianteRepo, BecaRepo, ReservaRepo, EventBusPort, QrGeneratorPort } from '../../use-cases/ports';
import { ReservasController } from '../../interface-adapters/controllers/reservas.controller';
import { EstudiantesController } from '../../interface-adapters/controllers/estudiantes.controller';
import { AnaliticaController } from '../../interface-adapters/controllers/analitica.controller';

// Los casos de uso no conocen a Nest: aquí (la capa más externa) se les entregan sus puertos.
const casoDeUso = <T>(clase: new (...args: any[]) => T, ...inject: any[]) =>
  ({ provide: clase, useFactory: (...deps: any[]) => new clase(...deps), inject });

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
  controllers: [ReservasController, EstudiantesController, AnaliticaController],
  providers: [
    EstudianteGateway, BecaGateway, ReservaGateway, SnsBus, QrGenerator,
    { provide: EstudianteRepo, useExisting: EstudianteGateway },
    { provide: BecaRepo, useExisting: BecaGateway },
    { provide: ReservaRepo, useExisting: ReservaGateway },
    { provide: EventBusPort, useExisting: SnsBus },
    { provide: QrGeneratorPort, useExisting: QrGenerator },
    { provide: APP_FILTER, useClass: ErroresNegocioFilter },
    casoDeUso(ResolverEstudianteUseCase, EstudianteRepo),
    casoDeUso(ReservarRacionUseCase, EstudianteRepo, ReservaRepo, EventBusPort, ResolverEstudianteUseCase),
    casoDeUso(ConfirmarReservaUseCase, ReservaRepo, EventBusPort, QrGeneratorPort),
    casoDeUso(CancelarReservaUseCase, ReservaRepo, EventBusPort),
    casoDeUso(ValidarIngresoUseCase, ReservaRepo),
    casoDeUso(ConsultarBecaUseCase, BecaRepo, ResolverEstudianteUseCase),
    casoDeUso(ListarEstudiantesUseCase, EstudianteRepo),
    casoDeUso(ObtenerEstudianteUseCase, ResolverEstudianteUseCase),
    casoDeUso(CrearEstudianteUseCase, EstudianteRepo),
    casoDeUso(AsignarBecaUseCase, BecaRepo, ResolverEstudianteUseCase),
    casoDeUso(ListarReservasAnaliticasUseCase, ReservaRepo, EstudianteRepo),
    casoDeUso(ListarBecasAnaliticasUseCase, BecaRepo, EstudianteRepo),
  ],
})
export class AppModule {}
