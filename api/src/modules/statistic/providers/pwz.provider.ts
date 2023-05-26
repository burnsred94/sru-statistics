import { Injectable } from '@nestjs/common';
import { PwzRepository } from '../repositories/pwz.repository';
import { PeriodsEntity } from '../entity/period.entity';
import { Result } from 'src/modules/interfaces/requested/create-requested.interface';

@Injectable()
export class PwzProvider {
    constructor(private readonly pwzRepository: PwzRepository) { }

    async create(
        value: Result,
        article: string,
        email: string,
        telegramId: string,
    ) {
        const period = new PeriodsEntity(value.position);
        const pwz = this.pwzRepository.create({
            article: article,
            name: value.address,
            position: [period],
            telegramId: telegramId,
            email: email,
        });
        return pwz;
    }
}
