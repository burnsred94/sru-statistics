import { Module } from '@nestjs/common';
import { DatabaseModule } from './modules/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtOptions } from './configs/jwt.config';
import { FetchModule } from './modules/fetch/fetch.module';
import { ScheduleModule } from '@nestjs/schedule';
import { UtilsModule } from './modules/utils/utils.module';
import { StructuresModule } from './modules/structures/structures.module';
import { LibraryModule } from './modules/lib/library.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    ScheduleModule.forRoot(),
    JwtModule.registerAsync(jwtOptions),
    PassportModule,
    FetchModule,
    UtilsModule,
    StructuresModule,
    LibraryModule,
  ],
})
export class AppModule { }
