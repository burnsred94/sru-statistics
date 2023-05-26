import { Injectable } from '@nestjs/common';
import { PwzProvider } from './pwz.provider';
import { KeysRepository } from '../repositories';
import {
    Data,
    Result,
} from 'src/modules/interfaces/requested/create-requested.interface';
import { map } from 'lodash';
import { PwzEntity } from '../entity/pwz.entity';
import { Types } from 'mongoose';
import { Pwz } from '../schemas/pwz.schema';

@Injectable()
export class KeyProvider {
    constructor(
        private readonly pwzProvider: PwzProvider,
        private readonly keysRepository: KeysRepository,
    ) { }

    async createKey(
        data: Data[],
        article: string,
        telegramId: string,
        email: string,
    ) {
        const keys = map(data, async key => {
            const pwz = map(key.result as Result[], async value => {
                const result = await this.pwzProvider
                    .create(value, article, telegramId, email)
                    .then(resolved => {
                        return resolved;
                    });
                return result;
            });
            const resolved = await Promise.all(pwz);

            return this.keysRepository
                .create({
                    key: key.key,
                    pwz: resolved as unknown as [Pwz],
                    article: article,
                    telegramId: telegramId,
                    email: email,
                })
                .then(resolved => {
                    return resolved;
                });
        });

        return await Promise.all(keys);
    }
}
