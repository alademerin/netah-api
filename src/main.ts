import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  ClassSerializerInterceptor,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { ResponseInterceptor } from './response/response.interceptor';

async function bootstrap() {
  console.log('FEL', process.env.FRONTEND_URL);
  const app = await NestFactory.create(AppModule);

  app.useLogger(new Logger());

  app.use(cookieParser());

  app.enableCors({
    origin: process.env.FRONTEND_URL, // e.g. http://localhost:9001
    credentials: true, // 👈 allow cookies
  });

  const reflector = app.get(Reflector);

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(reflector),
    new ResponseInterceptor(reflector),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip unknown fields
      forbidNonWhitelisted: true, // throw error for extra fields
      transform: true, // convert payload to DTO instance
    }),
  );

  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('NETAH API')
    .setDescription('API documentation for NETAH app')
    .setVersion('1.0')
    .addCookieAuth('access_token')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/v1/docs', app, document);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
