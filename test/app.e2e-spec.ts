import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { HttpStatus } from '@nestjs/common';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('올바르지 않은 타입의 문제 ID로 상세정보를 요청 할 경우 Bad Request 상태코드를 반환', () => {
    return request(app.getHttpServer())
      .get('/problem/detail/abc')
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('없는 문제의 상세정보를 요청 할 경우 Bad Request 상태코드를 반환', () => {
    return request(app.getHttpServer())
      .get('/problem/detail/-1')
      .expect(HttpStatus.BAD_REQUEST);
  });
});
