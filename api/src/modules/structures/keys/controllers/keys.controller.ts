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
import { concatMap, from } from 'rxjs';

@Controller('keys')
export class KeysController {
  protected readonly logger = new Logger(KeysController.name);

  constructor(private readonly keysService: KeysService) { }

  @Post('refresh')
  async refreshKey(@Body() key: RefreshKeyDto, @Res() response: Response) {
    try {
      await this.keysService.refreshKeyword(key._id);

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

  // @Post('enabled-keys')
  // async httpEnabled(@Body() data: StatisticsEnabledRMQ.Payload) {
  //   await this.enabledSubscription(data);
  //   console.log(`enabled user keys: ${data.userId}`);
  // }

  @RabbitMqSubscriber({
    exchange: RmqExchanges.STATISTICS,
    routingKey: StatisticsDisabledRMQ.routingKey,
    queue: StatisticsDisabledRMQ.queue,
    currentService: RmqServices.STATISTICS,
  })
  async disableSubscription(payload: StatisticsDisabledRMQ.Payload) {
    try {
      from(payload.users)
        .pipe(
          concatMap(async element => {
            const disabled = await this.keysService.keySubscriptionManagement(
              element.userId,
              false,
            );
            return { user: element, status: disabled };
          }),
        )
        .subscribe({
          next: value => {
            this.logger.log(
              `User ${value.user} disabled keys ${value.status ? `successfully` : `unsuccessfully`
              }`,
            );
          },
        });
    } catch (error) {
      this.logger.error(error.message);
    }
  }

  @RabbitMqSubscriber({
    exchange: RmqExchanges.STATISTICS,
    routingKey: StatisticsEnabledRMQ.routingKey,
    queue: StatisticsEnabledRMQ.queue,
    currentService: RmqServices.STATISTICS,
  })
  async enabledSubscription(payload: StatisticsEnabledRMQ.Payload) {
    try {
      const enabled = await this.keysService.keySubscriptionManagement(payload.userId, true);
      this.logger.log(
        enabled
          ? `User ${payload.userId} enabled keys successfully`
          : `User ${payload.userId} enabled keys unsuccessfully`,
      );
    } catch (error) {
      this.logger.error(error.message);
    }
  }

  @RabbitMqSubscriber({
    exchange: RmqExchanges.STATISTICS,
    routingKey: StatisticsUpdateRMQ.routingKey,
    queue: StatisticsUpdateRMQ.queue,
    currentService: RmqServices.STATISTICS,
  })
  async updatePeriod(payload: StatisticsUpdateRMQ.Payload) {
    await this.keysService.updateData(payload);
  }
}
