import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { BaseAPIDocument } from './swagger.document';
import { SwaggerModule } from '@nestjs/swagger';
import { ProblemModule } from './modules/problem/problem.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  const config = new BaseAPIDocument().initializeOptions();
  const document = SwaggerModule.createDocument(app, config, {
    include: [ProblemModule],
  });
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
