import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import { AppModule } from './app.module';
import { WinstonLoggerService } from './logger/winston/winston-logger.service';

// eslint-disable-next-line @typescript-eslint/ban-types
const BigIntPrototype: BigInt & { toJSON?: () => string } = BigInt.prototype;
BigIntPrototype.toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: { origin: process.env.MEDIAMINE_UI_HOSTNAME },
    bufferLogs: true,
    httpsOptions: {
      key: fs.readFileSync('./certs/cert-key.pem'),
      cert: fs.readFileSync('./certs/cert.pem')
    }
  });

  app.useLogger(new WinstonLoggerService());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Mediamine API')
    .setDescription('List of the Web APIs in Mediamine')
    .setVersion('1.0')
    .addTag('mediamine')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api', app, SwaggerModule.createDocument(app, swaggerConfig));

  await app.listen(parseInt(process.env.MEDIAMINE_API_PORT ?? '3002', 10));
}

bootstrap();
