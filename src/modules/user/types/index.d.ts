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
