import { Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ArticleService } from '../services';
import { EventsWS } from '../events';
import { Cron, CronExpression } from '@nestjs/schedule';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  perMessageDeflate: true,
})
export class ArticleGateway {
  private logger: Logger = new Logger('MessageGateway');

  constructor(
    private readonly articleService: ArticleService,
    private eventEmitter: EventEmitter2,
  ) { }

  clients = new Map();

  @WebSocketServer() server: Server;
  @SubscribeMessage('findByCity')
  async handleSendMessage(client: Socket, payload): Promise<void> {
    this.clients.set(client.id, {
      sockets: client,
      userId: payload.data.userId,
      pagination: payload,
    });
    await this.sender()
  }

  afterInit(server: Server) {
    this.logger.log('Initialized');
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client Disconnected: ${client.id}`);
    this.clients.delete(client.id);
    console.log(this.clients);
  }

  async handleConnection(client: Socket, ...arguments_: any[]) {
    this.logger.log(`Client Connected WS server: ${client.id}`);
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async sender() {
    this.clients.forEach(async client => {
      const findByCity = await this.articleService.findByCity(
        {
          userId: client.userId,
          city: client.pagination.data.city,
          periods: client.pagination.data.periods,
        },
        client.userId,
        {
          limit: client.pagination.query.limit,
          page: client.pagination.query.page,
          articleId: client.pagination.query.articleId,
        },
      );
      client.sockets.compress(true).emit('findByCity', findByCity);
    });
  }
}
