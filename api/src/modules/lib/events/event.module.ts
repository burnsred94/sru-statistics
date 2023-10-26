import { Module } from '@nestjs/common';
import { EventPostmanDispatcher } from './event-postman.dispatcher';
import { EventSenderService as EventPostmanService } from './services';
import { EventGateway } from './gateway';

const POSTMAN = [EventPostmanService, EventPostmanDispatcher];

@Module({
  providers: [...POSTMAN, EventGateway],
  exports: [EventPostmanDispatcher],
})
export class EventsModule {}
