import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'https://loquacious-bonbon-7f72d2.netlify.app',
  });

  const PORT = process.env.PORT || 8080;

  await app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}
bootstrap();
