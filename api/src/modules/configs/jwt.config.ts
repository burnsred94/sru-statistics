import { ConfigService } from '@nestjs/config';
import { JwtModuleAsyncOptions } from '@nestjs/jwt';

export const jwtOptions: JwtModuleAsyncOptions = {
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => ({
    global: true,
    secret: configService.get<string>('SECRET_KEY_AUTH'),
  }),
};
