import { Types } from 'mongoose';
import { Pwz } from 'src/modules/statistic/schemas/pwz.schema';

export interface IKeys {
  key: string;
  article: string;
  telegramId: string;
  email: string;
  pwz: [Pwz];
}
