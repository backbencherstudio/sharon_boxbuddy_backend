// notification.controller.ts
import {
  Controller,
  Get,
  Query,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
  Req,
  Post,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { NotificationService } from './notification.service';
import { Request } from 'express';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all notifications for current user' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'read',
    required: false,
    type: Boolean,
    description: 'Filter by read status',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated notifications for the user',
  })
  async findAll(
    @Req() req: Request,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
  ) {
    const userId = req.user?.userId;
    return await this.notificationsService.findAll(userId, {
      page,
      limit,
    });
  }

  // unread notification count
  @Get('unread-count')
  async unreadCount(@Req() req: Request) {
    const userId = req.user?.userId;
    return await this.notificationsService.unreadCount(userId);
  }

  // read all notifications
  @Post('read-all')
  async readAll(@Req() req: Request) {
    const userId = req.user?.userId;
    return await this.notificationsService.readAll(userId);
  }
}
