import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './infrastructure/http/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Sin whitelist/transform globales: nuestros DTOs son clases sin decoradores de class-validator.
  // La validación de dominio vive en entities/* (fuente de verdad).
  app.enableCors();
  const port = Number(process.env.PORT || 8080);
  await app.listen(port, '0.0.0.0');
  console.log(`[comensales-reservas] escuchando en :${port}`);
}
bootstrap();
