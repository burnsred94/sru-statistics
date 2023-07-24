import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { forEach, map } from 'lodash';
import { Types } from 'mongoose';
import { IProfileApiResponse } from 'src/interfaces/response/profile-api-response.interface';
import { EventsParser } from 'src/modules/article/events';
import { User } from 'src/modules/auth/user';
import { KeysService } from 'src/modules/keys';
import { FetchUtils } from '../utils';
import { RabbitMqPublisher, RabbitMqRequester } from 'src/modules/rabbitmq/services';
import { RmqExchanges } from 'src/modules/rabbitmq/exchanges';
import { GetPositionWidgetsRMQ, SearchPositionRMQ } from 'src/modules/rabbitmq/contracts/search';
import { GetProductRMQ } from 'src/modules/rabbitmq/contracts/products';
import { GetProfileRMQ, StartTrialProfileRMQ } from 'src/modules/rabbitmq/contracts/profile';
import { GetPositionDto } from '../dto';
import { PvzService } from 'src/modules/pvz';

@Injectable()
export class FetchProvider {
  protected readonly logger = new Logger(FetchProvider.name);

  constructor(
    private readonly rmqPublisher: RabbitMqPublisher,
    private readonly rmqRequester: RabbitMqRequester,
    private readonly keysService: KeysService,
    private readonly pvzService: PvzService,
    private readonly fetchUtils: FetchUtils,
  ) {}

  count = 0;

  async startTrialPeriod(userId: User) {
    await this.rmqPublisher.publish({
      exchange: RmqExchanges.PROFILE,
      routingKey: StartTrialProfileRMQ.routingKey,
      payload: { userId: userId },
    });
  }

  async getPositionWidget(dto: GetPositionDto) {
    const product = await this.rmqRequester.request<GetProductRMQ.Payload, GetProductRMQ.Response>({
      exchange: RmqExchanges.PRODUCT,
      routingKey: GetProductRMQ.routingKey,
      timeout: 5000 * 10,
      payload: { article: dto.article },
    });

    if (product.status === true) {
      const data = await this.rmqRequester.request({
        exchange: RmqExchanges.SEARCH,
        routingKey: GetPositionWidgetsRMQ.routingKey,
        timeout: 5000 * 10,
        payload: dto,
      });

      if (data) {
        return {
          product: {
            article: dto.article,
            ...product,
          },
          find_data: data,
        };
      }
    } else {
      throw new BadRequestException(`Мы не смогли найти товар по артикулу: ${dto.article}`);
    }
  }

  async fetchArticleName(article: string) {
    return await this.rmqRequester.request<GetProductRMQ.Payload, GetProductRMQ.Response>({
      exchange: RmqExchanges.PRODUCT,
      routingKey: GetProductRMQ.routingKey,
      timeout: 5000 * 10,
      payload: { article: article },
    });
  }

  async fetchProfileTowns(id: User): Promise<IProfileApiResponse> {
    return await this.rmqRequester.request<GetProfileRMQ.Payload, GetProfileRMQ.Response>({
      exchange: RmqExchanges.PROFILE,
      routingKey: GetProfileRMQ.routingKey,
      payload: { userId: id as unknown as number },
    });
  }

  @OnEvent(EventsParser.SEND_TO_PARSE)
  async fetchParser(payload: { keysId: Types.ObjectId[] }) {
    setImmediate(async () => {
      const { keysId } = payload;
      const keys = map(keysId, key => ({ _id: key, active: true }));
      const getKeys = await this.keysService.findById(keys, 'all');
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

  @OnEvent(EventsParser.ONE_PWZ_PARSE)
  async onePwzParse(payload: { pwzIds: Types.ObjectId[] }) {
    setImmediate(async () => {
      forEach(payload.pwzIds, async id => {
        const pvz = await this.pvzService.findById(id);
        const getKey = await this.keysService.findKey(pvz.key_id);

        await this.rmqPublisher.publish<SearchPositionRMQ.Payload>({
          exchange: RmqExchanges.SEARCH,
          routingKey: SearchPositionRMQ.routingKey,
          payload: {
            article: pvz.article,
            key: getKey.key,
            key_id: pvz.key_id,
            pvz: [
              {
                name: pvz.name,
                addressId: pvz._id as unknown as string,
                geo_address_id: pvz.geo_address_id,
                periodId: pvz.position.at(-1)._id as unknown as string,
              },
            ],
          },
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
