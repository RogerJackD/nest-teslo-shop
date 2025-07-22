import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>  
  ){}

  async create(createProductDto: CreateProductDto) {

    try {

      // if( !createProductDto.slug ){
      //   createProductDto.slug = createProductDto.title
      //     .toLowerCase()
      //     .replaceAll(' ','_')
      //     .replaceAll("'",'')
      // } else {
      //   createProductDto.slug = createProductDto.slug
      //     .toLowerCase()
      //     .replaceAll(' ','_')
      //     .replaceAll("'",'')
      // }

      const product = this.productRepository.create(createProductDto);
      await this.productRepository.save( product );

      return product;
      
    } catch (error) {
      this.handleDBException(error)
    }

  }

  async findAll() {
    const product = await this.productRepository.find();
    return product;
    
  }

  async findOne(id: string) {
    const productFind = await this.productRepository.findOne({
      where : {
        id : id
      }
    });

    if( !productFind ){
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    return productFind;
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }

  private handleDBException( error: any ){
    if( error.code === '23505' )
        throw new BadRequestException(error.detail);
      
      this.logger.error(error.message);
      throw new InternalServerErrorException('Unexpected - check log');
  }
}
