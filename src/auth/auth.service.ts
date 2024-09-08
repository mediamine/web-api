import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import { UserService } from 'src/auth/user/user.service';
import { WinstonLoggerService } from 'src/logger/winston/winston-logger.service';
import { TokenUserPayload } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private logger: WinstonLoggerService
  ) {
    this.logger.setContext(AuthService.name);
  }

  async login(username: string, password: string): Promise<any> {
    const user = await this.userService.findOne(username);

    if (user?.password !== createHash('sha256').update(password).digest('hex')) {
      throw new UnauthorizedException();
    }
    this.logger.log(`Logged in as user: ${user.username}`);

    const payload: TokenUserPayload = { sub: user.id, username: user.username };
    const token = await this.jwtService.signAsync(payload);
    this.logger.log(`Creating token: ${token.slice(0, 10)}...`);

    return {
      token,
      username: user.username,
      editor: user.editor
    };
  }
}
