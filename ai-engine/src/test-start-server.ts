import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

/**
 * Script to start the AI Engine server for testing
 */
async function bootstrap() {
  try {
    // Create a NestJS application
    const app = await NestFactory.create(AppModule);
    
    // Enable CORS for development
    app.enableCors();
    
    // Get the port from environment or use default
    const port = process.env.PORT || 3000;
    
    // Start the server
    await app.listen(port);
    
    console.log(`AI Engine server is running on port ${port}`);
    console.log('Available endpoints:');
    console.log('- POST /ai/generate');
    console.log('- POST /ai/generate-with-tools');
    console.log('\nPress Ctrl+C to stop the server');
  } catch (error) {
    console.error('Failed to start server:', error.message);
  }
}

// Start the server
bootstrap();
