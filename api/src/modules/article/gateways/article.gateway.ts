import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { pullAt } from 'lodash';
import { Server, Socket } from 'socket.io';
import { ArticleService } from '../services';
import { SMFindByCityDto } from './dto';
import { FindByCityQueryDto } from '../dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ArticleGateway {
  private logger: Logger = new Logger('MessageGateway');

  constructor(private readonly articleService: ArticleService) {}

  clients = [];

  @WebSocketServer() server: Server;
  @SubscribeMessage('findByCity')
  async handleSendMessage(
    client: Socket,
    payload: SMFindByCityDto,
  ): Promise<void> {
    const find = this.clients.findIndex(
      object => object.client.id === client.id,
    );

    await this.checkClient(find, payload, client);

    const findCity = await this.articleService.findByCity(
      { city: payload.data.city_id, periods: payload.data.periods },
      payload.data.userId,
      payload.query as FindByCityQueryDto,
    );

    client.emit('findByCity', findCity);
  }

  afterInit(server: Server) {
    this.logger.log('Initialized');
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client Disconnected: ${client.id}`);
    this.clients = this.clients.filter(
      object => object.client.id !== client.id,
    );
    console.log(this.clients);
  }

  handleConnection(client: Socket, ...arguments_: any[]) {
    this.logger.log(`Client Connected: ${client.id}`);
    this.clients.push({ client: client });
    console.log(`Clients: ${this.clients}`);
  }

  @OnEvent('article.created-key')
  async sendCity(payload) {
    await this.sender(payload);
  }

  async sender(send) {
    const findClient = this.clients.find(
      client => client.data.userId === send.userId,
    );

    const findByCity = await this.articleService.findByCity(
      { city: findClient.data.city_id, periods: findClient.data.periods },
      findClient.data.userId,
      findClient.query,
    );

    await findClient.client.emit('findByCity', findByCity);
  }

  async checkClient(index: number, payload: SMFindByCityDto, client: Socket) {
    if (index === -1) {
      this.clients.push({
        client: client,
        data: payload.data,
        query: payload.query,
      });
    } else {
      pullAt(this.clients, index);
      this.clients.push({
        client: client,
        data: payload.data,
        query: payload.query,
      });
    }
  }
}
