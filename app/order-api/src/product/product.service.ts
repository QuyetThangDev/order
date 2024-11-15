import { BadRequestException, forwardRef, Inject, Injectable } from "@nestjs/common";
import { Product } from "./product.entity";
import { In, Repository } from "typeorm";
import { InjectMapper } from "@automapper/nestjs";
import { Mapper } from "@automapper/core";
import { InjectRepository } from "@nestjs/typeorm";
import { CreateProductRequestDto, ProductResponseDto, UpdateProductRequestDto } from "./product.dto";
import { CatalogService } from 'src/catalog/catalog.service';
import { VariantService } from 'src/variant/variant.service';
import { Variant } from "src/variant/variant.entity";

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Variant)
    private readonly variantRepository: Repository<Variant>,
    @InjectMapper() private readonly mapper: Mapper,
    private catalogService: CatalogService,
  ) {}

  /**
   * Create a new product
   * @param {CreateProductRequestDto} createProductDto The data to create product
   * @returns {Promise<ProductResponseDto>} The created product
   * @throws {BadRequestException} if the product name already exists
   * @throws {BadRequestException} if the catalog with specified slug is not found
   */
  async createProduct(
    createProductDto: CreateProductRequestDto
  ): Promise<ProductResponseDto>{
    const product = await this.productRepository.findOneBy({
      name: createProductDto.name
    });
    if(product) throw new BadRequestException('Product name is existed');

    const catalog = await this.catalogService.findOne( createProductDto.catalog );
    if(!catalog) throw new BadRequestException('Catalog is not found');

    const productData = this.mapper.map(createProductDto, CreateProductRequestDto, Product);
    Object.assign(productData, { catalog });
    
    const newProduct = await this.productRepository.create(productData);
    const createdProduct = await this.productRepository.save(newProduct);
    const productDto = this.mapper.map(createdProduct, Product, ProductResponseDto);
    return productDto;
  }

  /**
   * Get all products or get products by catalog
   * @param {string} catalog The catalog slug if get product by catalog 
   * @returns {Promise<ProductResponseDto[]>} The products array is retrieved
   */
  async getAllProducts(
    catalog?: string
  ): Promise<ProductResponseDto[]> {
    const products = await this.productRepository.find({
      where: {
        catalog: {
          slug: catalog
        }
      },
      relations: [
        'catalog',
        'variants.size'
      ]
    });
    const productsDto = this.mapper.mapArray(products, Product, ProductResponseDto);
    return productsDto;
  }

  /**
   * Update the product information
   * @param {string} slug The product slug is updated
   * @param {UpdateProductRequestDto} requestData The data to update product 
   * @returns {Promise<ProductResponseDto>} The product data after updated
   * @throws {BadRequestException} if product that need updating is not found
   * @throws {BadRequestException} if catalog update for product is not found
   */
  async updateProduct(
    slug: string,
    requestData: UpdateProductRequestDto
  ): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOneBy({ slug });
    if(!product) throw new BadRequestException('Product not found');

    const catalog = await this.catalogService.findOne( requestData.catalog );
    if(!catalog) throw new BadRequestException('Catalog not found');

    const productData = this.mapper.map(requestData, UpdateProductRequestDto, Product);

    Object.assign(productData, { catalog });
    Object.assign(product, productData);
    const updatedProduct = await this.productRepository.save(product);
    const productDto = this.mapper.map(updatedProduct, Product, ProductResponseDto);
    return productDto;
  }
  
  /**
   * Delete product by slug
   * @param {string} slug The slug of product is deleted
   * @returns {Promise<number>} The number of product records is deleted
   * @throws {BadRequestException} if product is not found
   */
  async deleteProduct(
    slug: string
  ): Promise<number>{
    const product = await this.productRepository.findOne({
      where: { slug },
      relations: ['variants']
    });
    if(!product) throw new BadRequestException('Product not found');

    // Delete variants
    if(product.variants?.length > 0) {
      const variantSlugs = product.variants.map((item) => item.slug);

      await this.variantRepository.softDelete({
        slug: In(variantSlugs),
      })
    }

    const deleted = await this.productRepository.softDelete({ slug });
    return deleted.affected || 0;
  }

  /**
   * Find a product by slug
   * @param {string} slug The slug of product is retrieved
   * @returns {Promise<Product | null>} The product information
   */
 async findOne(slug: string): Promise<Product | null>{
  return await this.productRepository.findOneBy({ slug });
 }
}