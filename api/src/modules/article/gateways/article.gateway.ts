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
    private eventEmitter: EventEmitter2
  ) { }

  clients = new Map();

  @WebSocketServer() server: Server;
  @SubscribeMessage('findByCity')
  async handleSendMessage(
    client: Socket,
    payload
  ): Promise<void> {
    this.clients.set(client.id, {
      sockets: client,
      userId: payload.data.userId,
      pagination: payload,
    });
    this.eventEmitter.emit(EventsWS.SEND_ARTICLES, { userId: payload.data.userId })
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

  @OnEvent(EventsWS.SEND_ARTICLES)
  async sender(send: { userId: number }) {
    this.clients.forEach(async client => {
      if (client.userId === send.userId) {
        const findByCity = await this.articleService.findByCity(
          {
            userId: client.userId,
            city: client.pagination.city,
            periods: client.pagination.periods,
          },
          send.userId,
          {
            limit: Number(client.pagination.limit),
            page: Number(client.pagination.page),
            articleId: client.pagination.articleId,
          },
        );
        client.sockets.compress(true).emit('findByCity', findByCity);
      }
    });


  }
}


