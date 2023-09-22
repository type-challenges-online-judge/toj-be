import { DocumentBuilder } from '@nestjs/swagger';

export class BaseAPIDocument {
  private builder = new DocumentBuilder();

  public initializeOptions() {
    return this.builder
      .setTitle('TOJ API Spec')
      .setDescription('Type-challenges Online Judge의 API 명세입니다.')
      .setVersion('0.0.1')
      .addBearerAuth()
      .build();
  }
}
