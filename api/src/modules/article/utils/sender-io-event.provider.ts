import { Injectable, Logger } from '@nestjs/common';
import { User } from 'src/modules/auth';
import { PvzService } from 'src/modules/pvz';

export interface ISenderData {
    userId: User;
    article: string;
    key_count: number;
}

@Injectable()
export class SenderIoEvent {
    protected readonly logger = new Logger(SenderIoEvent.name);

    constructor(private readonly pvzService: PvzService) { }

    async sender(data: ISenderData) {
        const length = Math.round(data.key_count / 30);
        let counter = 1;
        while (counter < length) {
            setTimeout(async () => {
                await this.senderGenerator(data);
                this.logger.log(`Send User: ${data.userId} to count ${counter--}`)
            }, (1000 * 15) * counter)
            counter++;
        }
    }

    private async senderGenerator(data: ISenderData) {
        return new Promise(resolve => {
            this.pvzService.findUserStatus(data.userId, data.article)
                .then(userStatus => {
                    userStatus()
                        .then(data => {
                            typeof data === 'boolean' ? resolve(1) : resolve(0);
                        });
                });
        });
    }
}
