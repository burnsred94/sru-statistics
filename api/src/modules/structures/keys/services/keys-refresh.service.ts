import { Injectable, Logger } from '@nestjs/common';
import { KeysRepository } from '../repositories';
import { User } from 'src/modules/auth';
import { concatMap, from } from 'rxjs';
import { KeysRefreshPopulate } from '../constants';
import { IKeysRefreshService } from '../types';
import { KeysUtilsFacade } from '../utils';
import { SearchPositionRMQ } from 'src/modules/rabbitmq/contracts/search';
import { FetchProvider } from 'src/modules/fetch';
import { EventPostmanDispatcher } from 'src/modules/lib/events/event-postman.dispatcher';
import { EventPostmanEnum } from 'src/modules/lib/events/types/enum';

@Injectable()
export class KeysRefreshService implements IKeysRefreshService {
  protected readonly logger = new Logger(KeysRefreshService.name);

  constructor(
    private readonly keysRepository: KeysRepository,
    private readonly keysUtilsFaced: KeysUtilsFacade,
    private readonly fetchProvider: FetchProvider,
    private readonly eventPostmanDispatcher: EventPostmanDispatcher,
  ) {}

  async refreshKeysInArticle(article: string, user: User): Promise<void> {
    const findKeys = await this.keysRepository.find(
      {
        article: article,
        userId: user,
        active: true,
        $or: [{ active_sub: true }, { active_sub: { $exists: false } }],
      },
      KeysRefreshPopulate,
    );

    from(findKeys)
      .pipe(
        concatMap(async element => {
          const result = await this.keysUtilsFaced.pullIdsToSendRMQ(element);
          return result;
        }),
      )
      .subscribe({
        next: async data => {
          await this.keysUtilsFaced.refreshKeyDataInDB(data.send_data.pvz, data.average);
          await this.sendRMQ(data.send_data);
        },
        complete: () => {
          this.logger.log(`Article send to update: ${article}`);
          this.eventPostmanDispatcher.dispatch({
            user: user,
            type: EventPostmanEnum.UPDATE_MANY_KEY,
            count: findKeys.length,
          });
        },
      });
  }

  private async sendRMQ(data: SearchPositionRMQ.Payload): Promise<void> {
    await this.fetchProvider.sendNewKey(data);
  }
}
