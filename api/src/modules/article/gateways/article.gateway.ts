import { Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ArticleService } from '../services';
import { EventsWS } from '../events';
import { Cron, CronExpression } from '@nestjs/schedule';
import { forEach } from 'lodash';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  perMessageDeflate: true,
  transports: ['polling', 'websocket'],
})
export class ArticleGateway {
  private logger: Logger = new Logger('MessageGateway');

  constructor(private readonly articleService: ArticleService) {}

  clients = [];

  @WebSocketServer() server: Server;
  @SubscribeMessage('findByCity')
  async handleSendMessage(client: Socket, payload): Promise<void> {
    this.clients.push({
      clientId: client.id,
      sockets: client,
      userId: payload.data.userId,
      data: payload.data,
      pagination: payload.query,
    });

    await this.sender({ userId: payload.data.userId });
  }

  afterInit(server: Server) {
    this.logger.log('Initialized');
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client Disconnected: ${client.id}`);
    this.clients = this.clients.filter(element => client.id !== element.clientId);
  }

  async handleConnection(client: Socket, ...arguments_: any[]) {
    this.logger.log(`Client Connected WS server: ${client.id}`);
  }

  @OnEvent(EventsWS.SEND_ARTICLES)
  async sender(payload: { userId: number }) {
    const find = this.clients.filter(userClient => userClient.userId === payload.userId);

    if (find.length > 0) {
      setImmediate(async () => {
        forEach(find, async element => {
          const data = await this.articleService.findByCity(
            element.data,
            payload.userId,
            element.query,
          );
          element.sockets.compress(true).emit('findByCity', data);
        });
      });
    }
  }
}
