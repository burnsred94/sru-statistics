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
  transports: ['polling', 'websocket']
})
export class ArticleGateway {
  private logger: Logger = new Logger('MessageGateway');

  constructor(
    private readonly articleService: ArticleService,
  ) { }

  clients = new Map();

  @WebSocketServer() server: Server;
  @SubscribeMessage('findByCity')
  async handleSendMessage(client: Socket, payload): Promise<void> {
    process.nextTick(async () => {

      this.clients.set(client.id, {
        sockets: client,
        userId: payload.data.userId,
        data: payload.data,
        pagination: payload.query,
      });
      await this.sender()
    })
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
          userId: client.data.userId,
          city: client.data.city,
          periods: client.data.periods,
        },
        client.userId,
        client.pagination
      );
      client.sockets.compress(true).emit('findByCity', findByCity);
    });
  }
}
