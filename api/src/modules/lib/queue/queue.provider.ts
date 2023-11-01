import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class QueueProvider {
  protected readonly logger = new Logger(QueueProvider.name);

  concurrency: number;
  running: number;
  queue: Array<any>;
  runtime: Promise<unknown>[];

  constructor(private readonly configService: ConfigService) {
    this.concurrency = 50;
    this.running = 0;
    this.runtime = [];
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
    while (this.running < this.concurrency && this.queue.length > 0) {
      const task = this.queue.shift();
      setTimeout(() => {

        const runtimeTask = new Promise(resolve => {
          resolve(task());
        });

        this.runtime.push(runtimeTask);

        this.running++;

        if (this.running === this.concurrency) {
          Promise.all(this.runtime).then(values => {
            if (values) (this.running = 0), this.next();
          });

        }
      }, 200)
      this.logger.debug(
        `Length current task: ${this.queue.length}, concurrent: ${this.concurrency}, ${this.running}`,
      );
    }
  }
}
