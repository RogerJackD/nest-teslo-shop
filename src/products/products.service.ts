import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException, Delete } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from 'src/common/dtos/pagination.dto';

import { validate as isUUID } from 'uuid'
import { Product, ProductImage } from './entities';
import { User } from 'src/auth/entities/auth.entity';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,
    
    private readonly dataSource: DataSource,
  ){}

  async create(createProductDto: CreateProductDto, user: User) {

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

      const { images = [], ...productDetails } = createProductDto;

      const product = this.productRepository.create({
        ...productDetails,
        images: images.map( image => this.productImageRepository.create({ url: image }) ),
        user,
      });
      await this.productRepository.save( product );

      return { ...product, images: images};
      
    } catch (error) {
      this.handleDBException(error) 
    }

  }

  async findAll( paginationDto: PaginationDto) {

    const { limit = 10, offset = 0 } = paginationDto;

    const products = await this.productRepository.find({
      take: limit,
      skip: offset,
      relations : {
        images: true
      },  //mostrar relaciones
    });
    return products.map( product => ({
      ...product,
      images : product.images?.map( img => img.url )
    }));
    
  }

  async findOne(term: string) {

    let product: Product | null;

    if( isUUID(term) ){
      product = await this.productRepository.findOneBy({id : term});
    } else {
      //product = await this.productRepository.findOneBy({slug : term});
      const queryBuilder = this.productRepository.createQueryBuilder('prod');
      product = await queryBuilder
        .where('LOWER(title) =:title or slug =:slug',{
          title: term.toLowerCase(),
          slug: term.toLowerCase(),
        })
        .leftJoinAndSelect('prod.images', 'prodImages')
        .getOne();
    }
    //const productFind = await this.productRepository.findOneBy({id});
    //const productFind = await this.productRepository.findOne({where : {id}});

    if( !product ){
      throw new NotFoundException(`Product with ${term} not found`);
    }
    return product;
  }

  async findOnePlain( term: string ){
    const { images= [], ...rest } = await this.findOne( term );
    return {
      ...rest,
      images : images.map( image => image.url)
    }
  }



  async update(id: string, updateProductDto: UpdateProductDto, user : User) {
    
    const { images, ...toUpdate } = updateProductDto;

    const product = await this.productRepository.preload({ id, ...toUpdate });
    if( !product ) throw new NotFoundException(`Product with id ${id} not found`);
    
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    
    try {
      if( images ){
        await queryRunner.manager.delete( ProductImage, { product: { id } });

        product.images = images.map(
          image => this.productImageRepository.create({ url: image })
        )
      } else {
        ///
      }
      product.user = user,
      await queryRunner.manager.save( product );
      //await this.productRepository.save( product );
      await queryRunner.commitTransaction();
      await queryRunner.release();

      return this.findOnePlain( id );

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

  async deleteAllProducts(){
    const query = this.productRepository.createQueryBuilder('product');
    
    try {
      return await query
        .delete()
        .where({})
        .execute();
    } catch (error) {
      this.handleDBException(error);
    }
  }
}
