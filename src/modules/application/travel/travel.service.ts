import { Injectable, Query } from '@nestjs/common';
import { CreateTravelDto } from './dto/create-travel.dto';
import { UpdateTravelDto } from './dto/update-travel.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { FindAllDto } from './dto/find-all-query.dto';
import { DateHelper } from 'src/common/helper/date.helper';
import { AnnouncementRequestDto } from './dto/announcement-request.dto';


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
      console.log(error)
      return {
        success: false,
        message: 'travel creation failed',
      }
    }
  }

  async findAll(findAllDto: FindAllDto, userId: string) {
    try {
      const { arrival, departure } = findAllDto;
      const where = {
        publish: true,
        user_id: {
          not: userId,
        },
      };
     
      if (arrival) {
        where['arrival'] = {
          lte: DateHelper.normalizeDateToEndOfDay(arrival),
        };
      }

      if (departure) {
        where['departure'] = {
          gte: DateHelper.normalizeDate(departure),
        };
      }else{
        where['departure'] = {
          gte: DateHelper.normalizeDate(new Date().toUTCString()), 
        };
      }

      const travels = await this.prisma.travel.findMany({
        where: where,
        skip: (findAllDto.page - 1) * findAllDto.limit,
        take: findAllDto.limit,
        include: {
          user: {
            select: {
              name: true,
              avatar: true,
            }
          },
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

      const total = await this.prisma.travel.count();
      const totalPages = Math.ceil(total / findAllDto.limit);
      const hasNextPage = findAllDto.page * findAllDto.limit < total;
      const hasPreviousPage = findAllDto.page > 1;

      return {
        success: true,
        message: 'travels fetched successfully',
        data: travels,
        pagination: {
          total,
          totalPages,
          currentPage: findAllDto.page,
          limit: findAllDto.limit,
          hasNextPage,
          hasPreviousPage
        }
      };
    } catch (err) {
      return {
        success: false,
        message: 'travels fetch failed',
      };
    }
  }

  async myCurrentTravels(userId: string) {
    try {
      const travels = await this.prisma.travel.findMany({
        where: {
          user_id: userId,
          departure: {
            gte: DateHelper.normalizeDate(new Date().toUTCString()),
          }
        },
        include: {
          announcement_requests: {
            include: {
              package: true,
            }
          },
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

  async myCurrentTravelsWithAnnounments(userId: string) {
    try {
      const travels = await this.prisma.travel.findMany({
        where: {
          user_id: userId,
          departure: {
            gte: DateHelper.normalizeDate(new Date().toUTCString()),
          },
          announcement_requests: {
            some: {}, // ✅ ensures announcement_requests is not empty
          },
        },
        include: {
          announcement_requests: {
            include: {
              package: true,
            },
          },
        },
        orderBy: [
          {
            departure: "asc",
          },
          {
            arrival: "asc",
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

  async updateRequest(id: string, userId: string, announcementRequestDto: AnnouncementRequestDto) {
    try {
      if((announcementRequestDto.is_accepted === undefined || announcementRequestDto.is_accepted === null) && (announcementRequestDto.is_refused === undefined || announcementRequestDto.is_refused === null)){
        return {
          success: false,
          message: 'Invalid request',
        };
      }

      // Step 1: Find the AnnouncementRequest by ID
      const request = await this.prisma.announcementRequest.findUnique({
        where: { id: id },
        include: {
          travel: true, // Include the associated travel to check user_id
        },
      });
  
      // Check if the announcement request exists
      if (!request) {
        return {
          success: false,
          message: 'Announcement request not found',
        };
      }
  
      // Step 2: Check if the associated travel has the correct user_id
      if (request.travel.user_id !== userId) {
        return {
          success: false,
          message: 'User is not authorized for this travel',
        };
      }

      const data: any = {}
      if(announcementRequestDto.is_accepted === true || announcementRequestDto.is_accepted === false){
        data['is_accepted'] = announcementRequestDto.is_accepted;
        if(announcementRequestDto.is_accepted === true)data['is_refused'] = false;
      }else if(announcementRequestDto.is_refused === true || announcementRequestDto.is_refused === false){
        data['is_refused'] = announcementRequestDto.is_refused;
        if(announcementRequestDto.is_refused === true)data['is_accepted'] = false;
      }
  
      // Step 3: Proceed with accepting the request and updating the travel data
      await this.prisma.announcementRequest.update({
        where: { id },
        data,
      });
  
      return {
        success: true,
        message: 'Travel updated successfully',
      };
    } catch (err) {
      console.error(err);
      return {
        success: false,
        message: 'Travel update failed',
      };
    }
  }
  

}
