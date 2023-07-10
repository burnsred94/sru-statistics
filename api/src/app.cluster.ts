// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import * as os from 'node:os';
import * as cluster from 'node:cluster';
import { Injectable, Logger } from '@nestjs/common';
import * as sticky from 'sticky-session';



const numberCPUs = os.cpus().length;

@Injectable()
export class AppClustersService {
    static logger = new Logger(AppClustersService.name);

    // eslint-disable-next-line @typescript-eslint/ban-types
    static clustering(callback: Function): void {
        if (cluster.isMaster) {
            this.logger.log(`Clustering service is starting pid ${process.pid}`);
            for (let index = 0; index < numberCPUs - 1; index++) {
                cluster.fork();
            }
            cluster.on('exit', (worker, code, signal) => {
                this.logger.log(
                    `Worker exited with code ${code} pid ${worker.process.pid} died. Restarting`,
                );
                cluster.fork();
            });
        } else {
            this.logger.log(`Clustering service is starting pid ${process.pid}`);
            sticky.listen(callback());
        }
    }
}