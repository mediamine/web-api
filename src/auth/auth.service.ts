import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import { UserService } from 'src/auth/user/user.service';
import { WinstonLoggerService } from 'src/logger/winston/winston-logger.service';
import { TokenUserPayload } from './dto/auth.dto';

const matchPasswordFormat01 = (password: string) => password.match(/{SHA-256}({[^}]+})([a-fA-F0-9]+)/);
const matchPasswordFormat02 = (password: string) => password.match(/{SHA-256}([a-fA-F0-9]+)/);
const matchPasswordFormat03 = (password: string) => password.match(/([a-fA-F0-9]+)/);

const checkPasswordMatch = (password: string, encoded = '', salt = '') => {
  if (
    encoded !==
    createHash('sha256')
      .update(password + salt)
      .digest('hex')
  ) {
    throw new UnauthorizedException();
  }
};

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

    if (!user?.password) {
      this.logger.error(`Missing password in db for user: ${user?.username}`);
      throw new UnauthorizedException();
    }

    const matches = matchPasswordFormat01(user?.password);
    this.logger.debug(`Checking for password format: '{SHA-256}{salt}encoded'`);
    if (matches && matches.length >= 3) {
      checkPasswordMatch(password, matches?.[2], matches?.[1]);
      this.logger.debug(`Authenticated using password format: '{SHA-256}{salt}encoded'`);
    } else {
      const matches = matchPasswordFormat02(user?.password);
      this.logger.debug(`Checking for password format: '{SHA-256}encoded'`);
      if (matches && matches.length >= 2) {
        checkPasswordMatch(password, matches?.[1]);
        this.logger.debug(`Authenticated using password format: '{SHA-256}encoded'`);
      } else {
        const matches = matchPasswordFormat03(user?.password);
        this.logger.debug(`Checking for password format: 'encoded'`);
        if (matches && matches.length >= 2) {
          checkPasswordMatch(password, matches?.[1]);
          this.logger.debug(`Authenticated using password format: 'encoded'`);
        }
      }
    }

    // TODO: deprecated
    // if (user?.password !== createHash('sha256').update(password).digest('hex')) {
    //   throw new UnauthorizedException();
    // }
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
