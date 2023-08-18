import { Injectable, Logger } from '@nestjs/common';

import { filter, forEach } from 'lodash';
import { Types } from 'mongoose';
import { KeysRepository } from '../repositories';
import { AverageService } from 'src/modules/average';
import { AverageStatus, IKey } from 'src/interfaces';
import { PvzService } from 'src/modules/pvz';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { concatMap, from, map } from 'rxjs';
import { EventsParser, EventsWS } from 'src/modules/article/events';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SearchPositionRMQ } from 'src/modules/rabbitmq/contracts/search';

@Injectable()
export class KeysService {
  protected readonly logger = new Logger(KeysService.name);

  constructor(
    private readonly keysRepository: KeysRepository,
    private readonly pvzService: PvzService,
    private readonly eventEmitter: EventEmitter2,
    private readonly averageService: AverageService,
  ) { }

  async create(data: IKey, id: Types.ObjectId) {
    const { keys } = data;

    const observe = from(keys)
      .pipe(map(async (element) => {
        const average = await this.averageService.create({
          average: 'Ожидается',
          difference: '0',
          userId: data.userId as unknown as number
        });

        const key = await this.keysRepository.create({
          article: data.article,
          key: element,
          userId: data.userId,
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
      next: async (data) => {
        const result = await data;

        this.eventEmitter.emit('keys.update', { id, key: result.id });

        const dataParse = {
          article: result.article,
          key: result.key,
          key_id: result.key_id,
          pvz: result.pwz.map(element => {
            return {
              name: element.name,
              average_id: result.average_id,
              addressId: String(element._id),
              geo_address_id: element.geo_address_id,
              periodId: String(element.position[0]._id),
            };
          })
        }

        this.eventEmitter.emit('create.sender', dataParse)
      },
      complete: () => {
        this.eventEmitter.emit(EventsWS.SEND_ARTICLES, { userId: data.userId })
      }
    })
  }

  @Cron('20 0 * * *', { timeZone: 'Europe/Moscow' })
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
      next: async (data) => {
        const send = data;
        this.eventEmitter.emit('create.sender', send)
      }
    })
  }

  async countUserKeys(userId, status) {
    return await this.keysRepository.countUserKeys(userId, status);
  }

  async updateMany(ids: Array<Types.ObjectId>) {
    return await this.keysRepository.updateMany(ids);
  }

  async selectToParse(statusSearch: AverageStatus, selected: { active: boolean, userId?: number }) {
    const { ids, data } = await this.keysRepository.selectToParser(statusSearch, selected);
    const status = (async () => await this.averageService.statusUp(ids, AverageStatus.PENDING))
    return { data: data, stFn: status }
  }

  async countToParse(status: AverageStatus, userId?: number) {
    return await this.averageService.getCountToParse(status, userId);
  }

  async findAll() {
    return await this.keysRepository.findToUpdateED();
  }

  async findKeysByUser(userId: string) {
    return await this.keysRepository.findKeysByUser(userId);
  }

  async findAndNewPeriod() {
    await this.pvzService.findAndCreate();
  }

  @OnEvent('update.average')
  async addedNewAverage() {
    const keys = await this.keysRepository.findToUpdateED();

    forEach(keys, async key => {
      const average = await this.averageService.create({
        average: 'Ожидается',
        difference: '0',
        userId: key.userId as unknown as number
      });
      await this.keysRepository.updateAverage(key._id, average._id);
    });
    this.logger.verbose(`Update completed average keys: ${keys.length}`);
  }

  async updateAverage(payload: { id: Types.ObjectId, average: number; key_id: Types.ObjectId }) {
    const result = await this.averageService.update(payload);

    if (result) {
      const average = await this.keysRepository.findAverageKey(payload.key_id);
      console.log(`Calc`, average.length, average)
      if (average.length > 0) await this.averageService.updateDiff(average)
    }
  }

  async findById(ids: Array<{ _id: Types.ObjectId; active: boolean }>, searchObject: string) {
    const keysIterator = ids.map(async item => {
      const key = await this.keysRepository.findById(item._id, searchObject);
      return key;
    });

    const resolved = await Promise.all(keysIterator);
    return resolved;
  }

  async findKey(id: string) {
    return await this.keysRepository.findKey(id);
  }

  async removeKey(id: Types.ObjectId) {
    return await this.keysRepository.setStatusKey(id, false);
  }

  async activateKey(ids: Types.ObjectId[]) {
    forEach(ids, async (id: Types.ObjectId) => {
      await this.keysRepository.setStatusKey(id, true);
    })
  }
}
