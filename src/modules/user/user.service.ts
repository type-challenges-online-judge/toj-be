import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@/modules/user/entities';
import { Brackets, Repository } from 'typeorm';
import { SubmitCode } from '@/modules/submit/entities';
import { SCORE_STATE } from '@/constants';

type UserInfo = {
  snsId: number;
  name: string;
  profileUrl: string;
};

type SolvedProblemItem = {
  id: number;
  title: string;
  level: string;
  number: number;
  oldestSolvedDate: Date;
};

type MinifiedSolvedProblemItem = Pick<SolvedProblemItem, 'id'>;

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(SubmitCode)
    private readonly submitRepo: Repository<SubmitCode>,
  ) {}

  async getUser(userId: number): Promise<User | null> {
    const user = await this.userRepo.findOne({ where: { snsId: userId } });

    return user;
  }

  async getUserInfo(snsId: number): Promise<UserInfo> {
    const userInfo = await this.userRepo.findOne({
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

  public async getUsersSolvedProblems(
    snsId: number,
    minify: boolean = false,
  ): Promise<SolvedProblemItem[] | MinifiedSolvedProblemItem[]> {
    const user = await this.userRepo.findOne({
      where: {
        snsId,
      },
    });

    if (minify) {
      const solvedProblemList = await this.submitRepo
        .createQueryBuilder('S')
        .select(['S.problemId as id'])
        .andWhere('S.userId = :id', { id: user.id })
        .andWhere(
          new Brackets((qb) => {
            qb.orWhere('S.correct_score = :notExist', {
              notExist: SCORE_STATE.NOT_EXIST,
            }).orWhere('S.correct_score = :right', { right: 100 });
          }),
        )
        .andWhere(
          new Brackets((qb) => {
            qb.orWhere('S.valid_score = :notExist', {
              notExist: SCORE_STATE.NOT_EXIST,
            }).orWhere('S.valid_score = :right', { right: 100 });
          }),
        )

        .addGroupBy('S.problemId')
        .getRawMany<MinifiedSolvedProblemItem>();

      return solvedProblemList;
    } else {
      const solvedProblemList = await this.submitRepo
        .createQueryBuilder('S')
        .select([
          'S.problemId as "id"',
          'P.title as "title"',
          'P.level as "level"',
          'P.number as "number"',
          'MIN(S.createdAt) as "oldestSolvedDate"',
        ])
        .leftJoin('S.problem', 'P')
        .andWhere('S.userId = :id', { id: user.id })
        .andWhere(
          new Brackets((qb) => {
            qb.orWhere('S.correct_score = :notExist', {
              notExist: SCORE_STATE.NOT_EXIST,
            }).orWhere('S.correct_score = :right', { right: 100 });
          }),
        )
        .andWhere(
          new Brackets((qb) => {
            qb.orWhere('S.valid_score = :notExist', {
              notExist: SCORE_STATE.NOT_EXIST,
            }).orWhere('S.valid_score = :right', { right: 100 });
          }),
        )
        .addGroupBy('S.problemId')
        .addGroupBy('P.title')
        .addGroupBy('P.level')
        .addGroupBy('P.number')
        .getRawMany<SolvedProblemItem>();

      return solvedProblemList;
    }
  }
}
