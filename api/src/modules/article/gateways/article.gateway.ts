import { Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ArticleService } from '../services';
import { EventsWS } from '../events';
import { Cron, CronExpression } from '@nestjs/schedule';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  perMessageDeflate: true,
  transports: ['polling', 'websocket'],
})
export class ArticleGateway {
  private logger: Logger = new Logger('MessageGateway');

  constructor(private readonly articleService: ArticleService) { }

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
    this.clients = this.clients.filter(client => client.id !== client.clientId);
  }

  async handleConnection(client: Socket, ...arguments_: any[]) {
    this.logger.log(`Client Connected WS server: ${client.id}`);
  }

  @OnEvent(EventsWS.SEND_ARTICLES)
  async sender(payload: { userId: number }) {
    const find = this.clients.find(userClient => userClient.userId === payload.userId);

    if (find) {
      setImmediate(async () => {
        const data = await this.articleService.findByCity(find.data, payload.userId, find.query);
        find.sockets.compress(true).emit('findByCity', data);
      })
    }
  }
}
