import { BadRequestException, Injectable } from '@nestjs/common';
import { MessageStatus, PrismaClient } from '@prisma/client';
import appConfig from '../../../config/app.config';
import { CreateMessageDto } from './dto/create-message.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { ChatRepository } from '../../../common/repository/chat/chat.repository';
import { SojebStorage } from '../../../common/lib/Disk/SojebStorage';
import { DateHelper } from '../../../common/helper/date.helper';
import { MessageGateway } from './message.gateway';
import { UserRepository } from '../../../common/repository/user/user.repository';
import { Role } from 'src/common/guard/role/role.enum';
import { AttachmentDto } from './dto/attachment.dto';

@Injectable()
export class MessageService {
  constructor(
    private prisma: PrismaService,
    private readonly messageGateway: MessageGateway,
  ) {}

  // async create(user_id: string, createMessageDto: CreateMessageDto) {
  //   try {
  //     const data: any = {};

  //     if (createMessageDto.conversation_id) {
  //       data.conversation_id = createMessageDto.conversation_id;
  //     }

  //     if (createMessageDto.receiver_id) {
  //       data.receiver_id = createMessageDto.receiver_id;
  //     }

  //     if (createMessageDto.message) {
  //       data.message = createMessageDto.message;
  //     }

  //     // check if conversation exists
  //     const conversation = await this.prisma.conversation.findFirst({
  //       where: {
  //         id: data.conversation_id,
  //       },
  //     });

  //     if (!conversation) {
  //       return {
  //         success: false,
  //         message: 'Conversation not found',
  //       };
  //     }

  //     // check if receiver exists
  //     const receiver = await this.prisma.user.findFirst({
  //       where: {
  //         id: data.receiver_id,
  //       },
  //     });

  //     if (!receiver) {
  //       return {
  //         success: false,
  //         message: 'Receiver not found',
  //       };
  //     }

  //     const message = await this.prisma.message.create({
  //       data: {
  //         ...data,
  //         status: MessageStatus.SENT,
  //         sender_id: user_id,
  //       },
  //     });

  //     // update conversation updated_at
  //     await this.prisma.conversation.update({
  //       where: {
  //         id: data.conversation_id,
  //       },
  //       data: {
  //         updated_at: DateHelper.now(),
  //       },
  //     });

  //     // this.messageGateway.server
  //     //   .to(this.messageGateway.clients.get(data.receiver_id))
  //     //   .emit('message', { from: data.receiver_id, data: message });

  //     return {
  //       success: true,
  //       data: message,
  //       message: 'Message sent successfully',
  //     };
  //   } catch (error) {
  //     return {
  //       success: false,
  //       message: error.message,
  //     };
  //   }
  // }

  async create(
    senderId: string,
    createDto: CreateMessageDto,
    attachments: AttachmentDto[] = [],
  ) {
    try {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: createDto.conversation_id },
        select: {
          id: true,
          participant_id: true,
          creator_id: true,
        },
      });

      if (!conversation) {
        throw new BadRequestException('Conversation not found');
      }

      // Determine receiver
      const receiverId =
        conversation.creator_id === senderId
          ? conversation.participant_id
          : conversation.creator_id;

      const message = await this.prisma.message.create({
        data: {
          message: createDto.message,
          sender_id: senderId,
          receiver_id: receiverId,
          conversation_id: createDto.conversation_id,
          attachments: {
            createMany: {
              data: attachments.map((att) => ({
                name: att.name,
                type: att.type,
                size: att.size,
                file: att.file,
              })),
            },
          },
        },
        include: {
          attachments: true,
          sender: {
            select: {
              id: true,
              name: true,
              avatar: true,
              availability: true,
            },
          },
        },
      });

      // Update conversation last message
      await this.prisma.conversation.update({
        where: { id: createDto.conversation_id },
        data: {
          updated_at: new Date(),
          last_message_id: message.id,
        },
      });

      // full url for attachments
      message.attachments.forEach((att) => {
        att['file_url'] = SojebStorage.url(
          appConfig().storageUrl.message_attachment + att.file,
        );
      });

      return {
        success: true,
        data: message,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send message',
        error: error.message,
      };
    }
  }

  async markAsRead(userId: string, messageId: string) {
    try {
      const message = await this.prisma.message.update({
        where: {
          id: messageId,
          receiver_id: userId,
        },
        data: {
          is_read: true,
          read_at: new Date(),
        },
      });

      return {
        success: true,
        data: message,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to mark message as read',
      };
    }
  }

  async getMessageById(id: string) {
    return this.prisma.message.findUnique({
      where: { id },
      include: {
        attachments: true,
        sender: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            avatar: true,
            availability: true,
          },
        },
      },
    });
  }

  async markMessagesAsRead(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return { success: false, message: 'Conversation not found.' };
    }

    const message = await this.prisma.message.findFirst({
      where: {
        conversation_id: conversationId,
        receiver_id: userId,
        status: { not: 'READ' }, // Only update unread messages
      },
    });

    if (!message) {
      return { success: false, message: 'No unread messages found.' };
    }

    // Update all messages in the conversation where the receiver is the current user
    const updatedMessages = await this.prisma.message.updateMany({
      where: {
        conversation_id: conversationId,
        receiver_id: userId,
        status: { not: 'READ' }, // Only update unread messages
      },
      data: {
        status: 'READ', // Set to READ
        updated_at: new Date(), // Update the timestamp
      },
    });

    return {
      success: true,
      message: `Marked ${updatedMessages.count} messages as read.`,
      sender_id: message?.sender_id,
    };
  }

  async findAll({
    user_id,
    conversation_id,
    limit = 20,
    cursor,
  }: {
    user_id: string;
    conversation_id: string;
    limit?: number;
    cursor?: string;
  }) {
    try {
      const userDetails = await UserRepository.getUserDetails(user_id);

      const where_condition = {
        AND: [{ id: conversation_id }],
      };

      if (userDetails.type != Role.ADMIN) {
        where_condition['OR'] = [
          { creator_id: user_id },
          { participant_id: user_id },
        ];
      }

      const conversation = await this.prisma.conversation.findFirst({
        where: {
          ...where_condition,
        },
      });

      if (!conversation) {
        return {
          success: false,
          message: 'Conversation not found',
        };
      }

      const paginationData = {};
      if (limit) {
        paginationData['take'] = limit;
      }
      if (cursor) {
        paginationData['cursor'] = cursor ? { id: cursor } : undefined;
      }

      const messages = await this.prisma.message.findMany({
        ...paginationData,
        where: {
          conversation_id: conversation_id,
        },
        orderBy: {
          created_at: 'desc',
        },
        select: {
          id: true,
          message: true,
          created_at: true,
          status: true,
          sender: {
            select: {
              id: true,
              name: true,
              avatar: true,
              availability: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              avatar: true,
              availability: true,
            },
          },

          attachments: {
            select: {
              id: true,
              name: true,
              type: true,
              size: true,
              file: true,
            },
          },
        },
      });

      // add attachment url
      for (const message of messages) {
        if (message.attachments) {
          let fileUrls = [];
          for (const attachment of message.attachments) {
            fileUrls.push(
              SojebStorage.url(
                appConfig().storageUrl.message_attachment + attachment.file,
              ),
            );
          }
          message['attachments_urls'] = fileUrls;
        }
      }

      // add image url
      for (const message of messages) {
        if (message.sender && message.sender.avatar) {
          message.sender['avatar_url'] = SojebStorage.url(
            appConfig().storageUrl.avatar + message.sender.avatar,
          );
        }
        if (message.receiver && message.receiver.avatar) {
          message.receiver['avatar_url'] = SojebStorage.url(
            appConfig().storageUrl.avatar + message.receiver.avatar,
          );
        }
      }

      return {
        success: true,
        data: messages,
        pagination: {
          cursor:
            messages.length > 0 ? messages?.[messages.length - 1]?.id : null,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async updateMessageStatus(message_id: string, status: MessageStatus) {
    return await ChatRepository.updateMessageStatus(message_id, status);
  }

  async readMessage(message_id: string) {
    return await ChatRepository.updateMessageStatus(
      message_id,
      MessageStatus.READ,
    );
  }

  async updateUserStatus(user_id: string, status: string) {
    return await ChatRepository.updateUserStatus(user_id, status);
  }
}
