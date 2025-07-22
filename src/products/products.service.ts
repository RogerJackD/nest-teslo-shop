import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from 'src/common/dtos/pagination.dto';

import { Product } from './entities/product.entity';
import { validate as isUUID } from 'uuid'

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

  async findAll( paginationDto: PaginationDto) {

    const { limit = 10, offset = 0 } = paginationDto;

    const product = await this.productRepository.find({
      take: limit,
      skip: offset,
      //TODO: relacionar
    });
    return product;
    
  }

  async findOne(term: string) {

    let product: Product | null;

    if( isUUID(term) ){
      product = await this.productRepository.findOneBy({id : term});
    } else {
      //product = await this.productRepository.findOneBy({slug : term});
      const queryBuilder = this.productRepository.createQueryBuilder();
      product = await queryBuilder
        .where('LOWER(title) =:title or slug =:slug',{
          title: term.toLowerCase(),
          slug: term.toLowerCase(),
        }).getOne();
    }
    //const productFind = await this.productRepository.findOneBy({id});
    //const productFind = await this.productRepository.findOne({where : {id}});

    if( !product ){
      throw new NotFoundException(`Product with ${term} not found`);
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    
    const product = await this.productRepository.preload({
      id: id,
      ...updateProductDto,
    });

    if( !product ) throw new NotFoundException(`Product with id ${id} not found`);
    
    try {
      await this.productRepository.save( product );
      return product;
    } catch (error) {
      this.handleDBException( error );
    }
  }

  async remove(id: string) {
    const product = await this.findOne( id );
    //await this.productRepository.delete(id)
    await this.productRepository.remove(product)
    return 'action succesfully';
  }

  private handleDBException( error: any ){
    if( error.code === '23505' )
        throw new BadRequestException(error.detail);
      
      this.logger.error(error.message);
      throw new InternalServerErrorException('Unexpected - check log');
  }
}
