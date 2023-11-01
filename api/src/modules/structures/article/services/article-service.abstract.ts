import { User } from 'src/modules/auth';
import { EventPostmanDispatcher } from 'src/modules/lib/events/event-postman.dispatcher';
import { EventPostmanEnum } from 'src/modules/lib/events/types/enum';

export abstract class AbstractArticleService {
  constructor(private readonly abstractEventPostmanDispatcher: EventPostmanDispatcher) {}

  activateSendPostman(count: number, user: User) {
    this.abstractEventPostmanDispatcher.dispatch({
      count,
      type: EventPostmanEnum.CREATE_ARTICLE,
      user,
    });
    return this;
  }
}
