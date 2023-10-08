import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { DocumentBuilder } from '@nestjs/swagger';
import { SwaggerModule } from '@nestjs/swagger';
import { ProblemModule } from './modules/problem/problem.module';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import cookieParser = require('cookie-parser');
import { SubmitModule } from './modules/submit/submit.module';
import { configService } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /**
   * 쿠키 미들웨어
   */
  app.use(cookieParser());

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
   * dto에서 지정한 룰에 따라 자동으로 검증되도록 옵션 추가
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  /**
   * swagger 관련 설정
   */
  const config = new DocumentBuilder()
    .setTitle(
      `TOJ API Spec ${configService.isProduction() ? '(PROD)' : '(DEV)'}`,
    )
    .setDescription('Type-challenges Online Judge의 API 명세입니다.')
    .setVersion('0.0.1')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config, {
    include: [ProblemModule, AuthModule, UserModule, SubmitModule],
  });
  SwaggerModule.setup('api', app, document);

  /**
   * 3000번 포트로 앱 실행
   */
  await app.listen(3000);
}

bootstrap();
