import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TaskUpdateQueue {
  protected readonly logger = new Logger(TaskUpdateQueue.name);

  concurrency: number;
  running: number;
  queue: Array<any>;

  constructor(private readonly configService: ConfigService) {
    this.concurrency = 25;
    this.running = 0;
    this.queue = [];
  }

  pushTask(task) {
    if (this.queue.length > 0) {
      this.queue.push(task);
    } else {
      this.queue.push(task);
      this.next();
    }
  }

  next() {
    while (this.running <= this.concurrency && this.queue.length > 0) {
      const task = this.queue.shift();
      task();
      this.running++;

      if (this.running === this.concurrency) {
        new Promise(resolve => {
          setTimeout(() => {
            this.running = 0;
            resolve(this.next());
          }, 2000);
        });

        break;
      }


      // this.logger.debug(
      //   `Length current task: ${this.queue.length}, concurrent: ${this.concurrency}, ${this.running}`,
      // );
    }
  }
}
