import { PassportStrategy } from "@nestjs/passport";
import { InjectRepository } from "@nestjs/typeorm";

import { Repository } from "typeorm";
import { User } from "../entities/auth.entity";
import { JwtPayload } from "../interfaces/jwt-payload.interface";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from '@nestjs/config';
import { Injectable, UnauthorizedException } from "@nestjs/common";

@Injectable()
export class JwtStrategy extends PassportStrategy( Strategy ) {

    constructor(
        @InjectRepository(User)
        private readonly UserRepository : Repository<User>,
        ConfigService : ConfigService,
    ){
        super({
            secretOrKey: ConfigService.get('JWT_SECRET') as string,
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        })
    }

    async validate( payload: JwtPayload): Promise<User> {
        const { id } = payload;

        const user = await this.UserRepository.findOneBy({ id });

        if( !user )
            throw new UnauthorizedException('token not valid');

        if( !user.isActive )
            throw new UnauthorizedException('user is inactive, talk with an admin');

        return user;
    }
}