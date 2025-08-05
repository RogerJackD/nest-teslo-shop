import { Controller, Get, Post, Body, UseGuards, Request, Headers, SetMetadata } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { Auth, GetUser, RawHeaders, RoleProtected } from './decorators';
import { UseRoleGuard } from './guards/use-role.guard';

import { CreateUserDto, LoginUserDto } from './dto';
import { User } from './entities/auth.entity';
import { IncomingHttpHeaders } from 'http';
import { ValidRoles } from './interfaces';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }

  @Post('login')
  loginUser(@Body() loginUserDto: LoginUserDto ){
    return this.authService.login( loginUserDto );
  }

  @Get('private')
  @UseGuards( AuthGuard() )
  testingPrivateRoute(
    @Request() request: Express.Request,
    @GetUser() user: User,
    @GetUser('hola') userEmail: string,
    @RawHeaders() rawHeaders: string[],
    @Headers() headers: IncomingHttpHeaders
  ) {
    
    console.log(request)
    console.log(rawHeaders)
    return {
      ok: true,
      message: 'hola mundo private',
      user,
      userEmail,
      rawHeaders,
      headers
    }
  }

  //@SetMetadata('roles', ['admin-supremo', 'super-user'])

  @Get('private2')
  @RoleProtected( ValidRoles.superUser, ValidRoles.user )
  @UseGuards( AuthGuard(), UseRoleGuard )
  privateRoute2(
    @GetUser() user : User
  ){

    return {
      ok: true,
      user
    }
  }

  @Get('private3')
  @Auth( ValidRoles.admin, ValidRoles.superUser )
  privateRoute3(
    @GetUser() user : User
  ){

    return {
      ok: true,
      user
    }
  }
}
