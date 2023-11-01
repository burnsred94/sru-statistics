import { Injectable } from '@nestjs/common';
import { HydratedDocument } from 'mongoose';
import { Keys } from '../../schemas';

@Injectable()
export class InspectorKeywords {
  async inspect(verifiable: HydratedDocument<Keys>[], current: string[]) {
    return current.filter(element => !verifiable.some(({ key }) => key === element));
  }

  async inspectNot(verifiable: HydratedDocument<Keys>[], current: string[]) {
    return verifiable.filter(({ key }) => current.includes(key));
  }
}
