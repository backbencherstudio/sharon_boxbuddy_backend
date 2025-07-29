import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
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

  @Get(':user_id/received')
  async findAllRecevied(@Param('user_id') user_id: string) {
    return await this.reviewsService.findAllReceived(user_id);
  }

  @Get(':user_id/left')
  async findAllLefted(@Param('user_id') user_id: string) {
    return await this.reviewsService.findAllLeft(user_id);
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
