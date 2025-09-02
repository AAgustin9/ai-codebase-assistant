import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors();
  
  // Set global prefix so endpoints are accessible at /api/v1/...
  app.setGlobalPrefix('api/v1');
  
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
