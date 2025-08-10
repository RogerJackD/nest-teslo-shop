import { Module } from '@nestjs/common';
import { MessagesWsService } from './messages-ws.service';
import { MessagesWsGateway } from './messages-ws.gateway';

@Module({
  providers: [MessagesWsGateway, MessagesWsService],
})
export class MessagesWsModule {}
