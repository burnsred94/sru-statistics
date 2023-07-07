import { Logger, UseGuards } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ArticleService } from '../services';
import { EventsWS } from '../events';
import { AuthGuard } from '@nestjs/passport';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  perMessageDeflate: true,
})
export class ArticleGateway {
  private logger: Logger = new Logger('MessageGateway');

  constructor(private readonly articleService: ArticleService) {}

  clients = new Map();

  @WebSocketServer() server: Server;
  @SubscribeMessage('findByCity')
  async handleSendMessage(
    client: Socket,
    payload: { userId: number },
  ): Promise<void> {
    const parseCookie = await this.parseCookie(client.handshake.headers.cookie);
    this.clients.set(client.id, {
      sockets: client,
      userId: payload.userId,
      pagination: parseCookie,
    });
  }

  async parseCookie(cookie: string): Promise<{ [key: string]: string }> {
    const cookieObject: { [key: string]: string } = {};

    cookie.split(';').forEach(pair => {
      const [key, value] = pair.trim().split('=');
      cookieObject[key] = decodeURIComponent(value);
    });

    return cookieObject;
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
            periods: client.pagination.periods.split(','),
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

    // if (findClient) {
    //   const findByCity = await this.articleService.findByCity(
    //     {
    //       city: findClient.data.city,
    //       periods: findClient.data.periods,
    //       userId: findClient.data.userId,
    //     },
    //     findClient.data.userId,
    //     findClient.query,
    //   );

    // const reverse = findByCity.reverse();
    // process.nextTick(() => findClient.client.compress(true).emit('findByCity', reverse));
  }
}

//   async checkClient(index: number, userId: number, client: Socket) {
//     if (index === -1) {
//       this.clients.push({
//         client: client,
//         userId: userId,
//       });
//     } else {
//       pullAt(this.clients, index);
//       this.clients.push({
//         client: client,
//         userId: userId,
//       });
//     }
//   }
// }
