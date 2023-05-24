import { Injectable } from '@nestjs/common';
import { SSE_METADATA } from '@nestjs/common/constants';

@Injectable()
export class AppService {
  getHello(): string {
    console.log('getHello');
    return 'Hello World!';
  }
}
