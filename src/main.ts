import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { BaseAPIDocument } from './swagger.document';
import { SwaggerModule } from '@nestjs/swagger';
import { ProblemModule } from './modules/problem/problem.module';
import { RequestMethod } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /**
   * 루트 경로를 제외한 모든 경로에 `/api` 접두사 추가
   */
  app.setGlobalPrefix('api', {
    exclude: [
      {
        path: '/',
        method: RequestMethod.ALL,
      },
    ],
  });

  /**
   * swagger 관련 설정
   */
  const config = new BaseAPIDocument().initializeOptions();
  const document = SwaggerModule.createDocument(app, config, {
    include: [ProblemModule, AuthModule],
  });
  SwaggerModule.setup('api', app, document);

  /**
   * 3000번 포트로 앱 실행
   */
  await app.listen(3000);
}

bootstrap();
