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
import { CheckStatusTaskRMQ, GetPositionWidgetsRMQ, SearchPositionRMQ } from 'src/modules/rabbitmq/contracts/search';
import { GetProductRMQ } from 'src/modules/rabbitmq/contracts/products';
import { GetProfileRMQ, StartTrialProfileRMQ } from 'src/modules/rabbitmq/contracts/profile';
import { GetPositionDto } from '../dto';
import { PvzService } from 'src/modules/pvz';
import { TaskSenderQueue } from './task-sender-queue.provider';
import { Cron } from '@nestjs/schedule';
import { AverageStatus } from 'src/interfaces';

@Injectable()
export class FetchProvider {
  protected readonly logger = new Logger(FetchProvider.name);

  constructor(
    private readonly rmqPublisher: RabbitMqPublisher,
    private readonly rmqRequester: RabbitMqRequester,
    private readonly keysService: KeysService,
    private readonly taskSenderQueue: TaskSenderQueue,
    private readonly pvzService: PvzService,
    private readonly fetchUtils: FetchUtils,
  ) { }

  count = 0;

  timeReload = 3600 * 2000

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

    if (!product.product_name && !product.product_url)
      throw new BadRequestException(`Такого артикула не существует: ${dto.article}`);

    const data = await this.rmqRequester.request({
      exchange: RmqExchanges.SEARCH,
      routingKey: GetPositionWidgetsRMQ.routingKey,
      timeout: 5000 * 10,
      payload: dto,
    });

    return {
      product: {
        article: dto.article,
        ...product,
      },
      find_data: data,
    };
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
  async fetchParser(payload: { userId: number }) {
    await this.mainPostman(0, AverageStatus.WAIT_SENDING, { active: true, userId: payload.userId })
  }

  //Переписать на оптимизированное
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

  @Cron('50 09 * * *', { timeZone: 'Europe/Moscow' })
  async fetchStartUpdate() {
    await this.keysService.findAndNewPeriod();
  }

  //Главный почтальон сообщений
  @OnEvent('update.sender')
  async mainPostman(count = 0, status: AverageStatus = AverageStatus.WAIT_SENDING, query: { active: boolean, userId?: number } = { active: true }) {
    const { data, stFn } = await this.keysService.selectToParse(status, query);


    if (data.length > 0) {
      await this.fetchUtils.formatDataToParse(data)
        .then(async (data) => {
          setImmediate(() => forEach(data, (element) => {
            this.taskSenderQueue.pushTask(
              async () => await this.rmqPublisher.publish<SearchPositionRMQ.Payload>({
                exchange: RmqExchanges.SEARCH,
                routingKey: SearchPositionRMQ.routingKey,
                payload: element,
              }))
          }))
        })

      await stFn();
    }

    const checkCount = await this.keysService.countToParse(status, query.userId);

    if (checkCount > 0 && count === 0) {
      count += 1
      this.logger.verbose(`Count to send parser: ${count}`)
      this.mainPostman(count, status, query)
    } else {
      setTimeout(async () => {
        this.logger.log(`Checker to 10sec started`)
        await this.workApproval(query)
      }, 3600 * 2000);
    }
  }

  async workApproval(query: { active: boolean, userId?: number } = { active: true }, state = 0) {
    const checkCount = await this.keysService.countToParse(AverageStatus.PENDING);

    state === 3 ? this.logger.error(`Pending errors: ${checkCount}`) : null;

    if (checkCount > 0) {
      const countTask = await this.rmqRequester.request<CheckStatusTaskRMQ.Payload, CheckStatusTaskRMQ.Response>({
        exchange: RmqExchanges.SEARCH,
        routingKey: CheckStatusTaskRMQ.routingKey,
        timeout: 5000 * 10,
        payload: null,
      });

      if (countTask === 0) {
        await this.mainPostman(0, AverageStatus.PENDING, query);
      } else {
        setTimeout(async () => await this.workApproval(query, state + 1), 3600 * 2000)
      }
    }
  }
}

