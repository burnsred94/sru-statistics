import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TaskSenderQueue {
  protected readonly logger = new Logger(TaskSenderQueue.name);

  concurrency: number;
  running: number;
  queue: Array<any>;
  tasks = 0

  constructor(private readonly configService: ConfigService) {
    this.concurrency = Number(this.configService.get('LIMIT_TASK_UPDATE_QUEUE_CONCURRENCY'));
    this.running = 0;
    this.queue = [];
  }


  pushTask(task) {
    if (this.queue.length > 0) {
      this.queue.push(task);
      this.tasks++;
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
            }, 2500);
          });
        });

        break;
      }

    }
  }
}
