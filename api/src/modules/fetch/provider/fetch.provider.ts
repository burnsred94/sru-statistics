import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { forEach, map } from 'lodash';
import { Types } from 'mongoose';
import { IProfileApiResponse } from 'src/interfaces/response/profile-api-response.interface';
import { EventsParser } from 'src/modules/article/events';
import { User } from 'src/modules/auth/user';
import { KeysService } from 'src/modules/keys';
import { PeriodsEntity } from 'src/modules/periods';
import { FetchUtils } from '../utils';
import {
  RabbitMqPublisher,
  RabbitMqRequester,
} from 'src/modules/rabbitmq/services';
import { RmqExchanges } from 'src/modules/rabbitmq/exchanges';
import { GetPositionWidgetsRMQ, SearchPositionRMQ } from 'src/modules/rabbitmq/contracts/search';
import { GetProductRMQ } from 'src/modules/rabbitmq/contracts/products';
import { GetProfileRMQ, StartTrialProfileRMQ } from 'src/modules/rabbitmq/contracts/profile';
import { GetPositionDto } from '../dto';

@Injectable()
export class FetchProvider {
  constructor(
    private readonly rmqPublisher: RabbitMqPublisher,
    private readonly rmqRequester: RabbitMqRequester,
    private readonly keysService: KeysService,
    private readonly fetchUtils: FetchUtils,
  ) { }

  count = 0;

  async startTrialPeriod(userId: User) {
    await this.rmqPublisher.publish({ exchange: RmqExchanges.PROFILE, routingKey: StartTrialProfileRMQ.routingKey, payload: { userId: userId } })
  }

  async getPositionWidget(dto: GetPositionDto) {
    return await this.rmqRequester.request({
      exchange: RmqExchanges.SEARCH,
      routingKey: GetPositionWidgetsRMQ.routingKey,
      timeout: 5000 * 10,
      payload: dto
    })
  }

  async fetchArticleName(article: string) {
    return await this.rmqRequester.request<
      GetProductRMQ.Payload,
      GetProductRMQ.Response
    >({
      exchange: RmqExchanges.PRODUCT,
      routingKey: GetProductRMQ.routingKey,
      timeout: 5000 * 10,
      payload: { article: article },
    });
  }

  async fetchProfileTowns(id: User): Promise<IProfileApiResponse> {
    return await this.rmqRequester.request<
      GetProfileRMQ.Payload,
      GetProfileRMQ.Response
    >({
      exchange: RmqExchanges.PROFILE,
      routingKey: GetProfileRMQ.routingKey,
      payload: { userId: id as unknown as number },
    });
  }

  @OnEvent(EventsParser.SEND_TO_PARSE)
  async fetchParser(payload: { keysId: Types.ObjectId[] }) {
    process.nextTick(async () => {
      const { keysId } = payload;
      const keys = map(keysId, key => ({ _id: key, active: true }));
      const getKeys = await this.keysService.findById(
        keys,
        'all',
      );
      const formatted = await this.fetchUtils.formatDataToParse(getKeys);

      forEach(formatted, async element => {
        await this.rmqPublisher.publish<SearchPositionRMQ.Payload>({
          exchange: RmqExchanges.SEARCH,
          routingKey: SearchPositionRMQ.routingKey,
          payload: element,
        });
      });
    });
  }

  // @Cron(CronExpression.EVERY_10_MINUTES, { timeZone: 'Europe/Moscow' })
  async fetchUpdates() {
    process.nextTick(async () => {
      const keys = await this.keysService.findAndNewPeriod();
      await this.keysService.addedNewAverage(keys);
      const formatted = await this.fetchUtils.formatDataToParse(keys);
      forEach(formatted, async element => {
        await new Promise(resolve => {
          setTimeout(resolve, 100);
        });
        this.count += 1;
        console.log(this.count);
        await this.rmqPublisher.publish<SearchPositionRMQ.Payload>({
          exchange: RmqExchanges.SEARCH,
          routingKey: SearchPositionRMQ.routingKey,
          payload: element,
        });
      });
    });
  }
}
