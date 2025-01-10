import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { RevenueService } from './revenue.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HasRoles } from 'src/role/roles.decorator';
import { RoleEnum } from 'src/role/role.enum';
import { ApiResponseWithType } from 'src/app/app.decorator';
import {
  AggregateRevenueResponseDto,
  GetRevenueQueryDto,
  RevenueQueryResponseDto,
  RevenueResponseDto,
} from './revenue.dto';
import { AppResponseDto } from 'src/app/app.dto';
import { Public } from 'src/auth/public.decorator';

@Controller('revenue')
@ApiTags('Revenue')
@ApiBearerAuth()
export class RevenueController {
  constructor(private readonly revenueService: RevenueService) {}

  @Get()
  @HasRoles(
    RoleEnum.Staff,
    RoleEnum.Chef,
    RoleEnum.Manager,
    RoleEnum.Admin,
    RoleEnum.SuperAdmin,
  )
  @ApiOperation({ summary: 'Get all revenues' })
  @ApiResponseWithType({
    type: AggregateRevenueResponseDto,
    isArray: true,
    status: HttpStatus.OK,
    description: 'The revenues retrieved successfully',
  })
  async findAll(
    @Query(new ValidationPipe({ transform: true })) query: GetRevenueQueryDto,
  ) {
    const result = await this.revenueService.findAll(query);
    return {
      message: 'Revenues have been retrieved successfully',
      statusCode: HttpStatus.OK,
      timestamp: new Date().toISOString(),
      result,
    } as AppResponseDto<AggregateRevenueResponseDto[]>;
  }

  @Patch('latest')
  @HttpCode(HttpStatus.OK)
  @HasRoles(
    RoleEnum.Staff,
    RoleEnum.Chef,
    RoleEnum.Manager,
    RoleEnum.Admin,
    RoleEnum.SuperAdmin,
  )
  @ApiResponseWithType({
    status: HttpStatus.OK,
    description: 'Update latest revenue successfully',
    type: String,
  })
  @ApiOperation({ summary: 'Update latest revenue' })
  @ApiResponse({ status: 200, description: 'Update latest revenue successfully' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async updateLatestRevenue() {
    const result = await this.revenueService.updateLatestRevenueInCurrentDate();
    return {
      message: 'Update latest revenue successfully',
      statusCode: HttpStatus.OK,
      timestamp: new Date().toISOString(),
      result: 'Update latest revenue successfully',
    } as AppResponseDto<string>;
  }
}
