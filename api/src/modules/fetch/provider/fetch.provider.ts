import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { IProfileApiResponse } from 'src/interfaces/response/profile-api-response.interface';
import { User } from 'src/modules/auth/user';
import { RabbitMqPublisher, RabbitMqRequester } from 'src/modules/rabbitmq/services';
import { RmqExchanges } from 'src/modules/rabbitmq/exchanges';
import { GetPositionWidgetsRMQ, SearchPositionRMQ } from 'src/modules/rabbitmq/contracts/search';
import { GetProductRMQ } from 'src/modules/rabbitmq/contracts/products';
import { GetProfileRMQ, StartTrialProfileRMQ } from 'src/modules/rabbitmq/contracts/profile';
import { GetPositionDto } from '../dto';
import { GetFrequencyRMQ } from 'src/modules/rabbitmq/contracts/core-keys';

@Injectable()
export class FetchProvider {
  protected readonly logger = new Logger(FetchProvider.name);

  constructor(
    private readonly rmqPublisher: RabbitMqPublisher,
    private readonly rmqRequester: RabbitMqRequester,
  ) { }

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
      timeout: 5000 * 10,
    });
  }

  async sendNewKey(payload: SearchPositionRMQ.Payload) {
    await this.rmqPublisher.publish<SearchPositionRMQ.Payload>({
      exchange: RmqExchanges.SEARCH,
      routingKey: SearchPositionRMQ.routingKey,
      payload: payload,
    })
  }

  async getFrequency(key: string) {
    const result = await this.rmqRequester.request<
      GetFrequencyRMQ.Payload,
      GetFrequencyRMQ.Response
    >({
      exchange: RmqExchanges.CORE_KEYS,
      routingKey: GetFrequencyRMQ.routingKey,
      timeout: 5000 * 10,
      payload: { key: key },
    });

    return result.frequency;
  }
}
