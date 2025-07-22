import { Injectable } from '@nestjs/common';
import { CreateTravelDto } from './dto/create-travel.dto';
import { UpdateTravelDto } from './dto/update-travel.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TravelService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createTravelDto: CreateTravelDto) {
    try {
      const travel = await this.prisma.travel.create({
        data: createTravelDto,
      });
      return {
        success: true,
        message: 'travel created successfully',
        data: travel,
      }
    } catch (error) {
      return {
        success: false,
        message: 'travel creation failed',
      }
    }
  }

  async findAll() {

  }


  async myCurrentTravels(userId: string) {
    try {
      const travels = await this.prisma.travel.findMany({
        where: {
          user_id: userId,
          departure: {
            gte: new Date(),
          }
        },
        orderBy: [
          {
            departure: "asc",  // First ordering by departure date
          },
          {
            arrival: "asc",  // Then ordering by arrival date
          },
        ],
      });
      return {
        success: true,
        message: 'travels fetched successfully',
        data: travels,
      };
    } catch (err) {
      console.log(err);
      return {
        success: false,
        message: 'travels fetch failed',
      };
    }
  }

  async findOne(id: string) {
    try {
      const travel = await this.prisma.travel.findUnique({
        where: { id: id },
      });
      if (!travel) {
        return {
          success: false,
          message: 'travel not found',
        };
      }
      return {
        success: true,
        message: 'travel fetched successfully',
        data: travel,
      };
    } catch (err) {
      return {
        success: false,
        message: 'travel fetch failed',
      };
    }
  }

  async update(id: string, updateTravelDto: UpdateTravelDto, userId: string) {
    try {
      const travel = await this.prisma.travel.findUnique({
        where: { id: id, user_id: userId },
      });

      if (!travel) {
        return {
          success: false,
          message: 'travel not found',
        };
      }
      const updatedTravel = await this.prisma.travel.update({
        where: { id: id },
        data: updateTravelDto,
      });
      return {
        success: true,
        message: 'travel updated successfully',
        data: updatedTravel,
      };
    } catch (err) {
      return {
        success: false,
        message: 'travel update failed',
      };
    }
  }

  async remove(id: string, userId: string) {
    try {
      const travel = await this.prisma.travel.findUnique({
        where: { id: id, user_id: userId },
      });
      if (!travel) {
        return {
          success: false,
          message: 'travel not found',
        };
      }

      await this.prisma.travel.delete({
        where: { id: id },
      });
      return {
        success: true,
        message: 'travel deleted successfully',
      };
    } catch (err) {
      return {
        success: false,
        message: 'travel deletion failed',
      };
    }
  }
}
