import { AppDataSource } from '@/models/data-source';

AppDataSource.initialize()
  .then(() => {
    console.log('연결 성공');
  })
  .catch((err) => {
    console.log('연결 실패', err);
  });
