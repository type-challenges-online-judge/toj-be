import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@/models/entity';
import { Repository } from 'typeorm';
import { OAuthApp } from 'octokit';
import { configService } from '@/config/config.service';
import { BadRequestException } from '@nestjs/common';
import { tokenService } from '@/utils/token.service';

type UserInfo = {
  snsId: number;
  name: string;
};

@Injectable()
export class AuthService {
  oauthApp = new OAuthApp({
    clientId: configService.GITHUB_OAUTH_CLIENT_ID,
    clientSecret: configService.GITHUB_OAUTH_CLIENT_SECRET,
  });

  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
  ) {}

  async getGithubAccessToken(code: string): Promise<string> {
    try {
      const { authentication } = await this.oauthApp.createToken({
        code,
      });

      return authentication.token;
    } catch (e) {
      console.error(e);

      throw new BadRequestException(
        'Authorization Code가 주어지지 않았거나 올바르지 않습니다.',
      );
    }
  }

  async getGithubUserInfo(accessToken: string): Promise<UserInfo> {
    const {
      data: {
        user: { login, id },
      },
    } = await this.oauthApp.checkToken({
      token: accessToken,
    });

    return { name: login, snsId: id };
  }

  async registerUser(snsId: number, name: string) {
    const user = await this.repo.findOne({
      where: {
        snsId,
      },
    });

    if (!user) {
      this.repo.insert({
        snsId,
        name,
      });
    }
  }

  createJwtToken(snsId: number, name: string): string {
    return tokenService.createToken({
      snsId,
      name,
    });
  }
}
