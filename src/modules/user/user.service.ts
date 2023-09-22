import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@/models/entity';
import { Repository } from 'typeorm';

type UserInfo = {
  snsId: number;
  name: string;
  profileUrl: string;
};

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
  ) {}

  async getUserInfo(snsId: number): Promise<UserInfo> {
    const userInfo = await this.repo.findOne({
      where: {
        snsId,
      },
    });

    return {
      snsId: userInfo.snsId,
      name: userInfo.name,
      profileUrl: userInfo.profileUrl,
    };
  }
}
