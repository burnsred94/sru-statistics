import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TaskUpdateQueue {
  protected readonly logger = new Logger(TaskUpdateQueue.name);

  concurrency: number;
  running: number;
  queue: Array<any>;

  constructor(private readonly configService: ConfigService) {
    this.concurrency = this.configService.get('LIMIT_TASK_UPDATE_QUEUE_CONCURRENCY');
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
      setImmediate(() => {
        task();
      });

      this.running++;

      if (this.running === this.concurrency) {
        setImmediate(() => {
          new Promise(resolve => {
            setTimeout(() => {
              this.running = 0;
              resolve(this.next());
            }, 5000);
          });
        });

        break;
      }
      // this.logger.debug(
      //   `Length current task: ${this.queue.length}, concurrent: ${this.concurrency}, ${this.running}`,
      // );
    }
  }
}
