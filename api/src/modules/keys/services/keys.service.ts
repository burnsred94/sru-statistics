import { Injectable, Logger } from '@nestjs/common';
import { forEach } from 'lodash';
import { FilterQuery, Types } from 'mongoose';
import { KeysRepository } from '../repositories';
import { AverageService } from 'src/modules/average';
import { IKey, MessagesEvent } from 'src/interfaces';
import { PvzService } from 'src/modules/pvz';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { concatMap, from } from 'rxjs';
import { EventsWS } from 'src/modules/article/events';
import { Cron } from '@nestjs/schedule';
import { SearchPositionRMQ } from 'src/modules/rabbitmq/contracts/search';
import { Keys } from '../schemas';
import { FetchProvider } from 'src/modules/fetch';

@Injectable()
export class KeysService {
  protected readonly logger = new Logger(KeysService.name);

  count_keys = 0;

  constructor(
    private readonly keysRepository: KeysRepository,
    private readonly pvzService: PvzService,
    private readonly fetchProvider: FetchProvider,
    private readonly eventEmitter: EventEmitter2,
    private readonly averageService: AverageService,
  ) { }

  async create(data: IKey, id: Types.ObjectId) {
    const { keys } = data;

    const observe = from(keys)
      .pipe(concatMap(async (element) => {
        const average = await this.averageService.create({
          average: 'Ожидается',
          difference: '0',
          userId: data.userId as unknown as number
        });

        const frequency = await this.fetchProvider.getFrequency(element)

        const key = await this.keysRepository.create({
          article: data.article,
          key: element,
          userId: data.userId,
          frequency: frequency,
          countPvz: 0,
          average: [average._id],
        });

        const pwz = await Promise.all(data.pvz.map(async pvz => await this.pvzService.create(pvz, data.article, data.userId, String(key))));

        const ids = pwz.map((data) => data._id);

        this.keysRepository.update(key, ids);

        return {
          id: key,
          average_id: average._id,
          pwz, article: data.article,
          key: element,
          key_id: key,
        };
      }));

    observe.subscribe({
      next: (dataObserver) => {
        const result = dataObserver;

        this.eventEmitter.emit('keys.update', { id, key: result.id });
        this.count_keys++;

        if (this.count_keys === 50) {
          this.eventEmitter.emit(EventsWS.SEND_ARTICLES, { userId: data.userId });
          this.count_keys = 0;
        }

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
              periodId: element.position[0]._id
            };
          })
        }

        this.fetchProvider.sendNewKey(dataParse);

      },
      complete: () => {
        this.eventEmitter.emit(EventsWS.SEND_ARTICLES, { userId: data.userId });
      }
    })
  }

  @Cron('05 0 * * *', { timeZone: 'Europe/Moscow' })
  async nightParse() {
    const allKeys = await this.keysRepository.findAll({ active: true });

    const observe = from(allKeys)
      .pipe(concatMap(async (element): Promise<SearchPositionRMQ.Payload> => {
        const average = await this.averageService.create({
          average: 'Ожидается',
          difference: '0',
          userId: element.userId as unknown as number
        });

        const pwz_data = await this.pvzService.addedPosition(element.pwz, average._id)

        const update = await this.keysRepository.addedAverageToKey(element._id, average._id)

        const resolved = await Promise.all(pwz_data);

        if (update) return {
          article: element.article,
          key: element.key,
          key_id: element._id,
          pvz: resolved
        }

      }))

    observe.subscribe({
      next: (data) => {
        const send = data;
        this.fetchProvider.sendNewKey(send);

      },
      complete: () => {
        this.logger.log(`Data created for parsing: count keys - ${allKeys.length}, time - ${new Date().toLocaleDateString()}`)
      }
    })
  }

  async countUserKeys(userId, status) {
    return await this.keysRepository.countUserKeys(userId, status);
  }

  async updateMany(ids: Array<Types.ObjectId>) {
    return await this.keysRepository.updateMany(ids);
  }

  async updateAverage(payload: { id: Types.ObjectId, average: { cpm: number, promotion: number, promoPosition: number, position: number }; key_id: Types.ObjectId }) {
    await this.averageService.update(payload);
    const average = await this.keysRepository.findAverageKey(payload.key_id);
    if (average.length > 0) await this.averageService.updateDiff(average)
  }

  async findByMany(query: FilterQuery<Keys>, city: string) {
    return await this.keysRepository.findByMany(query, city)
  }

  async removeKey(id: Types.ObjectId) {
    return await this.keysRepository.setStatusKey(id, false);
  }

  async activateKey(ids: Types.ObjectId[]) {
    forEach(ids, async (id: Types.ObjectId) => {
      await this.keysRepository.setStatusKey(id, true);
    })
  }

  async refreshKey(_id: Types.ObjectId) {
    const find_result = await this.keysRepository.findByMany({ _id: _id }, 'all');

    if (find_result) {
      const data = find_result[0];

      this.averageService.updateRefresh(data.average.at(-1)._id);

      const dataParse: SearchPositionRMQ.Payload = {
        article: data.article,
        key: data.key,
        key_id: data._id,
        pvz: data.pwz.map((element: any) => {
          this.pvzService.periodRefresh(element._id)
          return {
            name: element.name,
            average_id: data.average.at(-1)._id,
            addressId: element._id,
            geo_address_id: element.geo_address_id,
            periodId: element.position.at(-1)._id
          };
        })
      }

      this.eventEmitter.emit(EventsWS.SEND_ARTICLES, { userId: data.userId });

      this.fetchProvider.sendNewKey(dataParse);

      setTimeout(() => {
        this.eventEmitter.emit(EventsWS.SEND_ARTICLES, { userId: data.userId });
      }, 10_000)

      return { key: data.key, event: MessagesEvent.REFRESH_KEY }
    }
  }
}
