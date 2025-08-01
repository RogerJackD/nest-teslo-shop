import { BadRequestException, Injectable } from '@nestjs/common';
import { existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class FilesService {
  
    getStaticProductImage( imageName: string){
        const path = join( __dirname,'../../static/products', imageName)
        if( !existsSync(path) ){
            throw new BadRequestException(`no product found with image ${ imageName }`);
        }
        return path;
    }
}
