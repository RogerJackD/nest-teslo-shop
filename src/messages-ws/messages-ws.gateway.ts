import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { MessagesWsService } from './messages-ws.service';
import { Server, Socket } from 'socket.io';
import { subscribe } from 'diagnostics_channel';
import { NewMessageDto } from './dto/new-message.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'src/auth/interfaces';

@WebSocketGateway({ cors : true })
export class MessagesWsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  
  @WebSocketServer() wss : Server

  constructor(
    private readonly messagesWsService: MessagesWsService,
    private readonly jwtService: JwtService,
  ) {}


  async handleConnection(client: Socket ) {
    const token = client.handshake.headers.authentication as string;
    let payload: JwtPayload;

    try {

      payload = this.jwtService.verify( token );
      await this.messagesWsService.registerClient( client, payload.id );

    } catch (error) {
      client.disconnect();
      return;
    }

    //console.log({payload})
    this.wss.emit('clients-updated', this.messagesWsService.getConnectedClients() );
  }


  handleDisconnect(client: Socket ) {
    //console.log('cliente desconectado', client.id);
    this.messagesWsService.removeClient( client.id );
    this.wss.emit('clients-updated', this.messagesWsService.getConnectedClients() );

  }


  @SubscribeMessage('message-from-client')
  onleMessageFromClient( client: Socket, payload: NewMessageDto){

    //!emite solo al cliente
    // client.emit('message-from-server',{
    //   fullName: 'soy me',
    //   message: payload.message || 'NO-message'
    // })
    //!emite todos MENOS al cliente inicial
    // client.broadcast.emit('message-from-server',{
    //   fullName: 'soy me',
    //   message: payload.message || 'NO-message'
    // })


    //!emite todos incluido el cliente inicial
    this.wss.emit('message-from-server',{
      fullName: this.messagesWsService.getUserFullName( client.id ),
      message: payload.message || 'NO-message'
    })


  }



}
