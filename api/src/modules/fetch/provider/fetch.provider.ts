import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { GotService } from '@t00nday/nestjs-got';
import { forEach, map } from 'lodash';
import { Types } from 'mongoose';
import { IProfileApiResponse } from 'src/interfaces/response/profile-api-response.interface';
import { EventsParser } from 'src/modules/article/events';
import { User } from 'src/modules/auth/user';
import { KeysService } from 'src/modules/keys';
import { PeriodsEntity } from 'src/modules/periods';
import { FetchUtils } from '../utils';
import axios from 'axios';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RabbitMqPublisher } from 'src/modules/rabbitmq/services';
import { RmqExchanges } from 'src/modules/rabbitmq/exchanges';
import { SearchPositionRMQ } from 'src/modules/rabbitmq/contracts/search';

@Injectable()
export class FetchProvider {
  constructor(
    private readonly gotService: GotService,
    private readonly rmqPublisher: RabbitMqPublisher,
    private readonly configService: ConfigService,
    private readonly keysService: KeysService,
    private readonly fetchUtils: FetchUtils,
  ) { }

  async fetchArticleName(article: string) {
    const url = await this.configService.get('PRODUCT_SERVICE_GET_ARTICLE');
    const data = await this.gotService.gotRef(url + article);
    return JSON.parse(data.body);
  }

  async fetchProfileTowns(id: User): Promise<IProfileApiResponse> {
    const url = await this.configService.get('PROFILE_API_URL');
    const data = await this.gotService.gotRef(url + id);
    const dataProfile = JSON.parse(data.body);
    return dataProfile.data as IProfileApiResponse;
  }

  @OnEvent(EventsParser.SEND_TO_PARSE)
  async fetchParser(payload: { keysId: Types.ObjectId[] }) {
    process.nextTick(async () => {

      const { keysId } = payload;
      const keys = map(keysId, key => ({ _id: key, active: true }));
      const currentDate = new PeriodsEntity('-').date();
      const getKeys = await this.keysService.findById(keys, [currentDate], 'all');
      const formatted = await this.fetchUtils.formatDataToParse(getKeys);

      forEach(formatted, async element => {
        await this.rmqPublisher.publish<SearchPositionRMQ.Payload>({
          exchange: RmqExchanges.SEARCH,
          routingKey: SearchPositionRMQ.routingKey,
          payload: element,
        });
      });
    })
  }

  @Cron(CronExpression.EVERY_10_MINUTES, { timeZone: 'Europe/Moscow' })
  async fetchUpdates() {
    process.nextTick(async () => {
      const keys = await this.keysService.findAndNewPeriod();
      await this.keysService.addedNewAverage(keys);
      const formatted = await this.fetchUtils.formatDataToParse(keys);
      forEach(formatted, async element => {
        await this.rmqPublisher.publish<SearchPositionRMQ.Payload>({
          exchange: RmqExchanges.SEARCH,
          routingKey: SearchPositionRMQ.routingKey,
          payload: element,
        });
      });
    })
  }
}
