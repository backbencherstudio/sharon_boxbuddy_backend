import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

@ApiTags('Review')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  async create(@Body() createReviewDto: CreateReviewDto, @Req() req: Request) {
    return await this.reviewsService.create(createReviewDto, req?.user?.userId);
  }

  @Get('received')
  async findAllRecevied(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Req() req: Request,
  ) {
    const userId = req?.user?.userId;
    const pageNumber = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNumber = Math.min(
      100,
      Math.max(1, parseInt(String(limit), 10) || 10),
    );
    return await this.reviewsService.findAllReceived(
      userId,
      limitNumber,
      pageNumber,
    );
  }

  @Get('left')
  async findAllLefted(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Req() req: Request,
  ) {
    const userId = req?.user?.userId;
    const pageNumber = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNumber = Math.min(
      100,
      Math.max(1, parseInt(String(limit), 10) || 10),
    );
    return await this.reviewsService.findAllLeft(
      userId,
      limitNumber,
      pageNumber,
    );
  }

  // @Get(':id')
  // async findOne(@Param('id') id: string) {
  //   return await this.reviewsService.findOne(id);
  // }

  // @Patch(':id')
  // async update(@Param('id') id: string, @Body() updateReviewDto: UpdateReviewDto) {
  //   return await this.reviewsService.update(+id, updateReviewDto);
  // }

  // @Delete(':id')
  // async remove(@Param('id') id: string) {
  //   return await this.reviewsService.remove(+id);
  // }
}
