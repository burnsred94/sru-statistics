import { Injectable } from '@nestjs/common';
import { PwzProvider } from './pwz.provider';
import { KeysRepository } from '../repositories';
import {
  Data,
  Result,
} from 'src/modules/interfaces/requested/create-requested.interface';
import { map } from 'lodash';
import { User } from 'src/modules/auth/user';

@Injectable()
export class KeyProvider {
  constructor(
    private readonly pwzProvider: PwzProvider,
    private readonly keysRepository: KeysRepository,
  ) {}

  async createKey(data: Data[], article: string, userId: User) {
    const keys = map(data, async name => {
      const pwz = await this.createPwz(
        name.result as Result[],
        article,
        userId,
      );

      const resolved = await Promise.all(pwz);

      return await this.keysRepository.create({
        key: name.key,
        pwz: resolved,
        article: article,
        userId: userId,
      });
    });

    const resolvedKeys = await Promise.all(keys);
    return resolvedKeys;
  }

  async createPwz(result: Result[], article: string, userId: User) {
    const pwz = map(result, async value => {
      if (value !== undefined) {
        const result = await this.pwzProvider.create(value, article, userId);
        return result;
      }
    });
    return pwz;
  }

  async findKeyUser(user: User, key: string, article: string) {
    const find = await this.keysRepository.findOne(user, key, article);
    return find;
  }
}
