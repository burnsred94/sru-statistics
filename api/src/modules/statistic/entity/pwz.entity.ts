import { Pwz } from '../schemas/pwz.schema';
import { PeriodsEntity } from './period.entity';

export class PwzEntity {
  article: string;
  telegramId: string;
  email: string;
  name: string;
  position: Array<PeriodsEntity>;

  constructor(data: Pwz) {
    this.article = data.article;
    this.telegramId = data.telegramId;
    this.email = data.email;
    this.name = data.name;
    this.position = data.position;
  }
}
