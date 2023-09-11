import { Body, Controller, HttpStatus, Logger, Post, Res } from '@nestjs/common';
import { KeysService } from '../services';
import { RabbitMqSubscriber } from 'src/modules/rabbitmq/decorators';
import { RmqExchanges, RmqServices } from 'src/modules/rabbitmq/exchanges';
import {
  StatisticsDisabledRMQ,
  StatisticsEnabledRMQ,
  StatisticsUpdateRMQ,
} from 'src/modules/rabbitmq/contracts/statistics';
import { Response } from 'express';
import { RefreshKeyDto } from '../dto';

@Controller('keys')
export class KeysController {
  protected readonly logger = new Logger(KeysController.name);

  constructor(
    private readonly keysService: KeysService,
  ) { }

  @Post('refresh')
  async refreshKey(@Body() key: RefreshKeyDto, @Res() response: Response) {
    try {
      await this.keysService.refreshKey(key._id);

      return response.status(HttpStatus.OK).send({
        data: [],
        error: [],
        status: HttpStatus.OK,
      });
    } catch (error) {
      this.logger.error(error);
      return response.status(HttpStatus.OK).send({
        data: [],
        error: [{ message: error.message }],
        status: error.statusCode,
      });
    }
  }

  @RabbitMqSubscriber({
    exchange: RmqExchanges.STATISTICS,
    routingKey: StatisticsDisabledRMQ.routingKey,
    queue: StatisticsDisabledRMQ.queue,
    currentService: RmqServices.STATISTICS,
  })
  async disableSubscription(payload: StatisticsDisabledRMQ.Payload) {
    this.logger.log(payload.users);
  }

  @RabbitMqSubscriber({
    exchange: RmqExchanges.STATISTICS,
    routingKey: StatisticsEnabledRMQ.routingKey,
    queue: StatisticsEnabledRMQ.queue,
    currentService: RmqServices.STATISTICS,
  })
  async enabledSubscription(payload: StatisticsEnabledRMQ.Payload) {
    this.logger.log(payload.userId);
  }

  @RabbitMqSubscriber({
    exchange: RmqExchanges.STATISTICS,
    routingKey: StatisticsUpdateRMQ.routingKey,
    queue: StatisticsUpdateRMQ.queue,
    currentService: RmqServices.STATISTICS,
  })
  async updatePeriod(payload: StatisticsUpdateRMQ.Payload) {
    try {
      await this.keysService.updateData(payload);
    } catch (error) {
      this.logger.error(error);
    }
  }

}
