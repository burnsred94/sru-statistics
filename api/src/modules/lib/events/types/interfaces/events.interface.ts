import { User } from 'src/modules/auth';
import { EventPostmanEnum } from '../enum';

export interface IEventPostman {
  type: EventPostmanEnum;
  count: number;
  user: User;
}
