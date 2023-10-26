import { Module } from '@nestjs/common';
import { QueueModule } from './queue/queue.module';
import { EventsModule } from './events/event.module';

@Module({
  imports: [QueueModule, EventsModule],
})
export class LibraryModule { }
