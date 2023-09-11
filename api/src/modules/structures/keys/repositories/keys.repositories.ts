import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Injectable, Logger } from '@nestjs/common';
import { Keys, KeysDocument } from '../schemas';
import { AbstractRepository } from 'src/modules/database';

@Injectable()
export class KeysRepository extends AbstractRepository<KeysDocument>{
  protected readonly logger = new Logger(KeysRepository.name);

  constructor(@InjectModel(Keys.name) readonly keysModel: Model<KeysDocument>) {
    super(keysModel)
  };
}
