import { Injectable } from "@nestjs/common";
import { EventSenderService } from "./services";
import { ManyPostStrategy, OnePostStrategy } from "./strategies";
import { IEventPostman } from "./types/interfaces";
import { EventGateway } from "./gateway";
import { User } from "src/modules/auth";
import { EventsCS } from "src/interfaces";
import { EventPostmanEnum } from "./types/enum";

@Injectable()
export class EventPostmanDispatcher {

    constructor(
        private readonly eventSenderService: EventSenderService,
        private readonly eventGateway: EventGateway
    ) { }

    public async dispatch(data: IEventPostman): Promise<void> {
        switch (data.type) {
            case EventPostmanEnum.CREATE_ARTICLE: {
                await this.manyPost(data)
            }
            case EventPostmanEnum.UPDATE_MANY_KEY: {
                await this.manyPost(data);
            }
            case EventPostmanEnum.UPDATE_ONE_KEY: {
                await this.onePost(data);
            }
        }
    }

    private async onePost(data: IEventPostman): Promise<void> {
        this.eventSenderService.setStrategy(new OnePostStrategy);
        this.eventSenderService.postman(
            data,
            (async () => await this.sendEventToWS(data.user, EventsCS.CREATE_ARTICLE))
        );
    }

    private async manyPost(data: IEventPostman): Promise<void> {
        this.eventSenderService.setStrategy(new ManyPostStrategy);
        this.eventSenderService.postman(data,
            (async () => await this.sendEventToWS(data.user, EventsCS.UPDATE_ARTICLE))
        );
    }

    private async sendEventToWS(user: User, event: EventsCS): Promise<boolean> {
        const userId = user as unknown as number
        return await this.eventGateway.sender({ userId, event })
    }

}
