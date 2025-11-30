import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createReviewDto: CreateReviewDto, user_id: string) {
    // check booking exists or not
    const booking = await this.prisma.booking.findFirst({
      where: {
        id: createReviewDto.booking_id,
        OR: [
          {
            owner_id: user_id,
          },
          {
            traveller_id: user_id,
          },
        ],
      },
    });

    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    // check booking is completed or not
    if (booking.status !== 'delivered') {
      throw new BadRequestException('Booking is not delivered');
    }

    // check user has already reviewed this package or not
    const review = await this.prisma.review.findFirst({
      where: {
        booking_id: createReviewDto.booking_id,
        review_by_id: user_id,
      },
    });

    if (review) {
      throw new BadRequestException('You have already reviewed this package');
    }

    // create review
    const data: any = {
      booking_id: createReviewDto.booking_id,
      review_text: createReviewDto.review_text,
      rating: createReviewDto.rating,
      review_from:
        booking.traveller_id == user_id ? 'traveller' : 'package_owner',
      review_by_id: user_id,
      review_for_id:
        booking.traveller_id == user_id
          ? booking.owner_id
          : booking.traveller_id,
    };
    const newReview = await this.prisma.review.create({
      data,
    });

    return {
      success: true,
      message: 'Review created successfully',
      data: newReview,
    };
  }

  async findAllReceived(user_id: string, limit: number, page: number) {
    // Fetch all reviews for the user
    const offset = (page - 1) * limit;
    const reviews = await this.prisma.review.findMany({
      where: {
        review_for_id: user_id,
      },
      include: {
        review_by: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            name: true,
            avatar: true,
          },
        },
      },
      skip: offset,
      take: limit,
    });

    // Calculate average rating and total count
    const totalReviews = reviews.length;
    const avgRating =
      totalReviews > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        : 0;

    return {
      success: true,
      message: 'Reviews fetched successfully',
      data: {
        reviews, // The full list of reviews
        summary: {
          total_reviews: totalReviews,
          average_rating: parseFloat(avgRating.toFixed(2)), // Rounds to 2 decimal places
        },
      },

      pagination: {
        total: totalReviews,
        currentPage: page,
        limit: limit,
        totalPages: Math.ceil(totalReviews / limit),
        hasNextPage: page * limit < totalReviews,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findAllLeft(user_id: string, limit: number, page: number) {
    const offset = (page - 1) * limit;
    // Fetch all reviews for the user
    const reviews = await this.prisma.review.findMany({
      where: {
        review_by_id: user_id,
      },
      include: {
        review_by: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            name: true,
            avatar: true,
          },
        },
      },
      skip: offset,
      take: limit,
    });

    // Calculate average rating and total count
    const totalReviews = reviews.length;
    const avgRating =
      totalReviews > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        : 0;

    return {
      success: true,
      message: 'Reviews fetched successfully',
      data: {
        reviews, // The full list of reviews
        summary: {
          total_reviews: totalReviews,
          average_rating: parseFloat(avgRating.toFixed(2)), // Rounds to 2 decimal places
        },
      },
      pagination: {
        total: totalReviews,
        currentPage: page,
        limit: limit,
        totalPages: Math.ceil(totalReviews / limit),
        hasNextPage: page * limit < totalReviews,
        hasPreviousPage: page > 1,
      },
    };
  }

  // async findOne(id: string) {

  // }

  // update(id: number, updateReviewDto: UpdateReviewDto) {
  //   return `This action updates a #${id} review`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} review`;
  // }
}
