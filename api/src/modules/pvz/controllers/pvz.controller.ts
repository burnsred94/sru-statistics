import { Controller, Logger } from '@nestjs/common';
import { PvzService } from '../services';
import { RabbitMqSubscriber } from 'src/modules/rabbitmq/decorators';
import { RmqExchanges, RmqServices } from 'src/modules/rabbitmq/exchanges';
import { StatisticsUpdateRMQ } from 'src/modules/rabbitmq/contracts/statistics';
import { TaskUpdateQueue } from '../utils';

@Controller('pvz')
export class PvzController {
  private readonly logger = new Logger(PvzController.name);

  constructor(
    private readonly pvzService: PvzService,
    private readonly taskUpdateQueue: TaskUpdateQueue,
  ) { }

  update = 0;

  @RabbitMqSubscriber({
    exchange: RmqExchanges.STATISTICS,
    routingKey: StatisticsUpdateRMQ.routingKey,
    queue: StatisticsUpdateRMQ.queue,
    currentService: RmqServices.STATISTICS,
  })
  async updatePeriod(payload: StatisticsUpdateRMQ.Payload) {
    try {
      if (payload.periodId !== undefined && payload.periodId !== null) {
        this.taskUpdateQueue.pushTask(async () => await this.pvzService.update(payload))
      }
    } catch (error) {
      this.logger.error(error);
    }
  }
}
