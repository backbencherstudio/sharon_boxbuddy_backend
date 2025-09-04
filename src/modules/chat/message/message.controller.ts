import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  Query,
  UseInterceptors,
  UploadedFiles,
  Patch,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageGateway } from './message.gateway';
import { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import appConfig from 'src/config/app.config';

@ApiBearerAuth()
@ApiTags('Message')
@UseGuards(JwtAuthGuard)
@Controller('chat/message')
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
    private readonly messageGateway: MessageGateway,
  ) { }

  // @ApiOperation({ summary: 'Send message' })
  // @Post()
  // async create(
  //   @Req() req: Request,
  //   @Body() createMessageDto: CreateMessageDto,
  // ) {
  //   const user_id = req.user.userId;
  //   const message = await this.messageService.create(user_id, createMessageDto);
  //   if (message.success) {
  //     const messageData = {
  //       message: {
  //         id: message.data.id,
  //         message_id: message.data.id,
  //         body_text: message.data.message,
  //         from: message.data.sender_id,
  //         conversation_id: message.data.conversation_id,
  //         created_at: message.data.created_at,
  //       },
  //     };
  //     this.messageGateway.server
  //       .to(message.data.conversation_id)
  //       .emit('message', {
  //         from: message.data.sender_id,
  //         data: messageData,
  //       });
  //     return {
  //       success: message.success,
  //       message: message.message,
  //     };
  //   } else {
  //     return {
  //       success: message.success,
  //       message: message.message,
  //     };
  //   }
  // }



  @Post()
  @ApiOperation({ summary: 'Send a new message' })
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'attachments', maxCount: 10 }], {
      storage: diskStorage({
        destination: appConfig().storageUrl.rootUrl + appConfig().storageUrl.message_attachment,
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(
            null,
            `${randomName}${file.originalname.replace(/\s+/g, '-')}`,
          );
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  async create(
    @Req() req: Request,
    @Body() createMessageDto: CreateMessageDto,
    @UploadedFiles() files: { attachments?: Express.Multer.File[] },
  ) {
    const user_id = req.user.userId;

    // Process attachments
    const attachments = files?.attachments?.map(file => ({
      name: file.originalname,
      type: file.mimetype,
      size: file.size,
      file: file.filename,
    }));

    const result = await this.messageService.create(
      user_id,
      createMessageDto,
      attachments,
    );

    if (result.success) {
      // Emit real-time event
      this.messageGateway.server
        .to(result.data?.receiver_id)
        .emit('new_message', result.data);

      return {
        success: true,
        data: result.data,
      };
    }

    throw new BadRequestException(result.error)


    // return {
    //   success: false,
    //   message: result.message,
    // };
  }

  @Patch('read/:id')
  @ApiOperation({ summary: 'Mark message as read' })
  async markAsRead(
    @Req() req: Request,
    @Param('id') messageId: string,
  ) {
    const user_id = req.user.userId;
    const result = await this.messageService.markAsRead(user_id, messageId);

    if (result.success) {
      const message = await this.messageService.getMessageById(messageId);
      this.messageGateway.server
        .to(message.receiver_id)
        .emit('message_read', {
          message_id: messageId,
          read_by: user_id,
          read_at: new Date(),
        });
    }

    return result;
  }


  @Patch(':conversationId/read')
  @ApiOperation({ summary: 'Mark all messages as read in conversation' })
  async markAllAsRead(
    @Req() req: Request,
    @Param('conversationId') conversationId: string, // use conversationId instead of messageId
  ) {
    const user_id = req?.user?.userId;

    // Mark all unread messages as read in the conversation for the current user
    const result = await this.messageService.markMessagesAsRead(user_id, conversationId);

    if (result.success) {
      // Fetch all the messages for the conversation that were marked as read
      // const messages = await this.messageService.getMessagesByConversationId(conversationId);

      // Notify all users in the conversation that messages have been read
      // messages.forEach((message) => {
      //   this.messageGateway.server
      //     .to(message.receiver_id)
      //     .emit('message_read', {
      //       message_id: message.id,
      //       read_by: user_id,
      //       read_at: new Date(),
      //     });
      // });
      
      this.messageGateway.server
       .to(result.sender_id)
       .emit('messages_read', {
          conversation_id: conversationId,
          read_by: user_id,
        });

    }

    return result;
  }


  // @Get(':id')
  // @ApiOperation({ summary: 'Get message by ID' })
  // async getMessage(@Param('id') id: string) {
  //   const message = await this.messageService.getMessageById(id);
  //   return {
  //     success: true,
  //     data: message,
  //   };
  // }

  @ApiOperation({ summary: 'Get all messages' })
  @Get()
  async findAll(
    @Req() req: Request,
    @Query()
    query: { conversation_id: string; limit?: number; cursor?: string },
  ) {
    const user_id = req.user.userId;
    const conversation_id = query.conversation_id as string;
    const limit = Number(query.limit);
    const cursor = query.cursor as string;
    try {
      const messages = await this.messageService.findAll({
        user_id,
        conversation_id,
        limit,
        cursor,
      });
      return messages;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
