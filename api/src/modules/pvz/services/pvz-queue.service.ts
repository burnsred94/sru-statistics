import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class PvzQueue {
    protected readonly logger = new Logger(PvzQueue.name);

    concurrency: number;
    running: number;
    queue: Array<any>;

    constructor(private readonly eventEmitter: EventEmitter2) {
        this.concurrency = 5;
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
        while (this.running < this.concurrency && this.queue.length > 0) {
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
                        }, 500);
                    });
                });

                break;
            }
        }
    }

    @OnEvent('update.started')
    async checkComplete() {
        this.logger.verbose(`Update completed periods`);
        setTimeout(() => {
            this.logger.verbose(`QUEUE-${PvzQueue.name} ${this.queue.length}`);
            this.eventEmitter.emit('update.average');
        }, 1000 * 60);

        setTimeout(() => {
            this.eventEmitter.emit('update.sender');
        }, (1000 * 60) * 2);

    }
}
