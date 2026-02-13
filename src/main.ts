import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

/**
 * Bootstrap function để khởi động NestJS application
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  // Enable CORS
  app.enableCors();

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('CSGT Violation Lookup API')
    .setDescription(
      'REST API để tra cứu thông tin xe vi phạm từ cổng thông tin CSGT Việt Nam',
    )
    .setVersion('2.0.0')
    .addTag('violations', 'Tra cứu vi phạm giao thông')
    .addTag('health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`
  ╔════════════════════════════════════════════════════════╗
  ║   🚗 CSGT Violation Lookup Service                    ║
  ║                                                        ║
  ║   Server running at: http://localhost:${port}        ║
  ║   API Docs: http://localhost:${port}/api-docs        ║
  ║                                                        ║
  ╚════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
