import { Injectable, Logger } from '@nestjs/common';
import { FilterQuery, PopulateOptions, Types, UpdateQuery } from 'mongoose';
import { KeysRepository } from '../repositories';
import { Average, AverageService } from '../../average';
import { EventsCS, IKey } from 'src/interfaces';
import { Pvz, PvzService } from '../../pvz';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { concatMap, from } from 'rxjs';
import { EventsWS } from '../../article/events';
import { Cron } from '@nestjs/schedule';
import { SearchPositionRMQ } from 'src/modules/rabbitmq/contracts/search';
import { FetchProvider } from 'src/modules/fetch';
import { ArticleDocument } from '../../article';
import { StatisticsUpdateRMQ } from 'src/modules/rabbitmq/contracts/statistics';
import { QueueProvider } from 'src/modules/lib/queue';
import { KeysDocument } from '../schemas';
import { KeysRefreshService } from './keys-refresh.service';
import { User } from 'src/modules/auth';
import { EventPostmanDispatcher } from 'src/modules/lib/events/event-postman.dispatcher';
import { EventPostmanEnum } from 'src/modules/lib/events/types/enum';

@Injectable()
export class KeysService {
  protected readonly logger = new Logger(KeysService.name);

  constructor(
    private readonly keysRepository: KeysRepository,
    private readonly keysRefreshService: KeysRefreshService,
    private readonly eventPostmanDispatcher: EventPostmanDispatcher,
    private readonly pvzService: PvzService,
    private readonly queueProvider: QueueProvider,
    private readonly fetchProvider: FetchProvider,
    private readonly eventEmitter: EventEmitter2,
    private readonly averageService: AverageService,
  ) { }

  async count(searchQuery: FilterQuery<KeysDocument>) {
    return await this.keysRepository.getCountDocuments(searchQuery);
  }

  //Поиск всех ключей и возможность делать кастом populated
  async find(searchQuery: FilterQuery<ArticleDocument>, populate?: PopulateOptions) {
    return await this.keysRepository.find(searchQuery, populate);
  }

  //Создание ключей через pipelines
  async create(data: IKey, id: Types.ObjectId) {
    from(data.keys)
      .pipe(
        concatMap(async element => {
          const average = await this.averageService.create({
            userId: data.userId as unknown as number,
          });

          const frequency = await this.fetchProvider.getFrequency(element);

          const key = await this.keysRepository.create({
            article: data.article,
            key: element,
            userId: data.userId,
            frequency: frequency,
            average: [average._id],
          });

          const pwz = await Promise.all(
            data.pvz.map(
              async pvz =>
                await this.pvzService.create(pvz, data.article, data.userId, String(key._id)),
            ),
          );

          const ids = pwz.map(data => data._id);

          await this.keysRepository.findOneAndUpdate({ _id: key._id }, { $push: { pwz: ids } });

          return {
            id: key,
            average_id: average._id,
            pwz,
            article: data.article,
            key: element,
            key_id: key._id,
          };
        }),
      )
      .subscribe({
        next: dataObserver => {
          const result = dataObserver;

          this.eventEmitter.emit('keys.update', { id, key: result.id });

          const dataParse: SearchPositionRMQ.Payload = {
            article: result.article,
            key: result.key,
            key_id: result.key_id,
            pvz: result.pwz.map(element => {
              return {
                name: element.name,
                average_id: result.average_id,
                addressId: element._id,
                geo_address_id: element.geo_address_id,
                periodId: element.position[0]._id,
              };
            }),
          };

          this.queueProvider.pushTask(async () => await this.fetchProvider.sendNewKey(dataParse));
        },
        complete: () => {
          this.eventEmitter.emit('metric.created', { article: id, user: data.userId });
          this.eventPostmanDispatcher.dispatch({
            user: data.userId,
            count: data.keys.length,
            type: EventPostmanEnum.CREATE_ARTICLE,
          });
        },
      });

    setTimeout(() => {
      this.eventEmitter.emit('metric.gathering', { article: id, user: data.userId });
    }, 1000 * 60 * 30);
  }

  @Cron('05 0 * * *', { timeZone: 'Europe/Moscow' })
  async nightParse() {
    const allKeys = await this.keysRepository.find(
      {
        active: true,
        $or: [{ active_sub: true }, { active_sub: { $exists: false } }],
      },
      { path: 'pwz', select: 'name geo_address_id', model: Pvz.name },
    );

    const observe = from(allKeys).pipe(
      concatMap(async (element): Promise<SearchPositionRMQ.Payload> => {
        const average = await this.averageService.create({
          userId: element.userId as unknown as number,
        });

        const pwz_data = await this.pvzService.addedPosition(element.pwz, average._id);

        await this.keysRepository.findOneAndUpdate(element._id, {
          $push: { average: average._id },
        });

        const resolved = await Promise.all(pwz_data);

        return {
          article: element.article,
          key: element.key,
          key_id: element._id,
          pvz: resolved,
        };
      }),
    );

    observe.subscribe({
      next: data => {
        const send = data;
        this.queueProvider.pushTask(async () => await this.fetchProvider.sendNewKey(send));
      },
      complete: () => {
        this.logger.log(
          `Data created for parsing: count keys - ${allKeys.length
          }, time - ${new Date().toLocaleDateString()}`,
        );
      },
    });
  }
  //Обновление множества ключей
  async updateMany(ids: Array<Types.ObjectId>, updateQuery: UpdateQuery<unknown>) {
    return await this.keysRepository.updateMany({ _id: ids }, updateQuery);
  }
  //Обновление срденего для ключа и подсчет разницы
  async updateAverage(payload: {
    id: Types.ObjectId;
    average: { cpm: number; promotion: number; promoPosition: number; position: number };
    key_id: Types.ObjectId;
  }) {
    await this.averageService.update(payload);
    const key = await this.keysRepository.findOne(
      { _id: payload.key_id },
      { path: 'average', select: 'average', model: Average.name },
    );
    const average = [key.average.at(-1), key.average.at(-2)].includes(undefined)
      ? []
      : [key.average.at(-1), key.average.at(-2)];

    if (average.length > 0) await this.averageService.updateDiff(average);
  }

  async removeKey(ids: Types.ObjectId[], user: User) {
    const result = await this.keysRepository.updateMany({ _id: ids }, { $set: { active: false } });
    await this.eventPostmanDispatcher.dispatch({
      user: user,
      count: ids.length,
      type: EventPostmanEnum.UPDATE_ONE_KEY,
    });
    return result;
  }

  //Активация ключей
  async activateKeys(ids: Types.ObjectId[]) {
    await this.keysRepository.updateMany(ids, { $set: { active: true } });
  }
  //Обновление одного ключа
  async refreshKey(_id: Types.ObjectId) {
    const key = await this.keysRepository.findOne(
      { _id: _id },
      { path: 'pwz', select: 'name position geo_address_id', model: Pvz.name },
    );
    if (key) {
      await this.averageService.updateRefresh(key.average.at(-1));

      const dataParse: SearchPositionRMQ.Payload = {
        article: key.article,
        key: key.key,
        key_id: key._id,
        pvz: key.pwz.map((element: any) => {
          this.pvzService.periodRefresh(element._id);
          return {
            name: element.name,
            average_id: key.average.at(-1),
            addressId: element._id,
            geo_address_id: element.geo_address_id,
            periodId: element.position.at(-1)._id,
          };
        }),
      };

      this.eventPostmanDispatcher.dispatch({
        user: key.userId,
        count: 1,
        type: EventPostmanEnum.UPDATE_ONE_KEY,
      });

      this.queueProvider.pushTask(async () => await this.fetchProvider.sendNewKey(dataParse));
    }
  }

  //Обновленние данных которые приходят из парсинга
  async updateData(payload: StatisticsUpdateRMQ.Payload) {
    setImmediate(async () => {
      if (payload.position.position >= 0) {
        payload.position.position = payload.position.position + 1; // Исправить в парсере и убрать
      }
      this.queueProvider.pushTask(async () => {
        await this.pvzService.update(
          payload,
          async () =>
            await this.updateAverage({
              id: payload.averageId,
              average: payload.position,
              key_id: payload.key_id,
            }),
        );
      });
    });
  }

  async keySubscriptionManagement(userId: number, update: boolean) {
    return await this.keysRepository.updateMany({ userId }, { active_sub: update });
  }

  async refreshAllKeysFromArticle(article: string, user: User) {
    await this.keysRefreshService.refreshKeysInArticle(article, user);
  }
}
