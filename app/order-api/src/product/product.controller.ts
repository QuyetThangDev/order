import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ProductService } from './product.service';
import { Public } from 'src/auth/public.decorator';
import { CreateProductRequestDto, ProductResponseDto } from './product.dto';

@ApiTags('Product')
@Controller('products')
@ApiBearerAuth()
export class ProductController {
  constructor(private productService: ProductService) {}

  @HttpCode(HttpStatus.OK)
  @Post()
  @ApiOperation({ summary: 'Create new product' })
  @ApiResponse({ status: 200, description: 'Create new product successfully' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async createProduct(
    @Body(ValidationPipe)
    requestData: CreateProductRequestDto,
  ): Promise<ProductResponseDto> {
    return this.productService.createProduct(requestData);
  }

  @HttpCode(HttpStatus.OK)
  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({ status: 200, description: 'Get all products successfully' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @ApiQuery({
    name: 'catalog',
    required: false,
    description: 'Filter products by catalog',
    type: String,
  })
  async getAllProducts(
    @Query('catalog') catalog: string
  ): Promise<ProductResponseDto[]> {
    return this.productService.getAllProducts(catalog);
  }
}
