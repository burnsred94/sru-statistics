import { Logger } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EventsCS } from 'src/interfaces';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  perMessageDeflate: true,
  transports: ['polling', 'websocket'],
})
export class EventGateway {
  private logger: Logger = new Logger('MessageGateway');

  clients = new Map<number, { client: Socket; exp: () => NodeJS.Timeout }>();

  @WebSocketServer() server: Server;
  @SubscribeMessage('subscriber')
  async handleSendMessage(client: Socket, payload): Promise<void> {
    const has = this.clients.has(payload.data.userId);
    if (has) {
      const data = this.clients.get(payload.data.userId);
      this.handleDisconnect(data.client);
    }

    this.clients.set(payload.data.userId, {
      client: client,
      exp: () =>
        setTimeout(
          () => {
            this.clients.delete(payload.data.userId), this.logger.log(`Delete: ${client.id}`);
          },
          60 * 1000 * 30,
        ),
    });

    const getClient = this.clients.get(payload.data.userId);
    getClient.exp();

    this.logger.log(`All Connections: ${this.clients.size}`);
  }

  afterInit(server: Server) {
    this.logger.log('Initialized');
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client Disconnected: ${client.id}`);
  }

  async handleConnection(client: Socket, ...arguments_: any[]) {
    this.logger.log(`Client Connected WS server: ${client.id}`);
  }

  async sender(payload: { userId: number; event: EventsCS }) {
    const user = this.clients.get(payload.userId);

    if (user) {
      user.client.compress(true).emit('subscriber', payload);
      return true;
    } else {
      this.logger.log(`Not found connection User: ${payload.userId}`);
      return false;
    }
  }
}
