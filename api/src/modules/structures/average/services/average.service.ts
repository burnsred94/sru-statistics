import { Injectable } from '@nestjs/common';
import { AverageRepository } from '../repositories';
import { Types } from 'mongoose';
import { MathUtils } from 'src/modules/utils/providers';

@Injectable()
export class AverageService {
  constructor(
    private readonly averageRepository: AverageRepository,
    private readonly mathUtils: MathUtils,
  ) { }

  async create(data: { userId: number }) {
    const date = await this.mathUtils.currentDate();
    return await this.averageRepository.create({
      average: 'Ожидается',
      userId: data.userId,
      delimiter: 0,
      loss_delimiter: 0,
      difference: '0',
      timestamp: date,
    });
  }

  async update(payload: {
    id: Types.ObjectId;
    average: { cpm: number; promotion: number; promoPosition: number; position: number };
    key_id: Types.ObjectId;
  }) {

    const find = await this.averageRepository.findOne({ _id: payload.id });
    const average = Number.isNaN(+find.average) ? 0 : Number(find.average);
    const promo = find.start_position === null ? 0 : Number(find.start_position);
    const delimiter = find.delimiter;

    if (payload.average.position < 0) {
      await this.averageRepository.findOneAndUpdate(
        { _id: payload.id },
        { $inc: { loss_delimiter: 1 } },
      );
    } else if (payload.average.position > 0) {
      if (payload.average.cpm > 0) {
        const old = average * delimiter;
        const mathOld = old + payload.average.promoPosition;
        const result = Math.round(mathOld / (delimiter + 1));

        const promoPos = promo * delimiter;
        const mathPromoPos = promoPos + payload.average.position;
        const resultPromo = Math.round(mathPromoPos / (delimiter + 1));

        await this.averageRepository.findOneAndUpdate(
          { _id: payload.id },
          {
            average: String(result),
            start_position: String(resultPromo),
            cpm: String(payload.average.cpm),
            $inc: { delimiter: 1 },
          },
        );

        return find.delimiter === 14;
      } else {
        const old = average * delimiter;
        const mathOld = old + payload.average.position;
        const result = Math.round(mathOld / (delimiter + 1));

        await this.averageRepository.findOneAndUpdate(
          { _id: payload.id },
          {
            average: String(result),
            $inc: { delimiter: 1 },
          },
        );

        return find.delimiter === 14;
      }
    }

    if (
      (average === 0 && delimiter + find.loss_delimiter === 4) ||
      (average === 0 && delimiter + find.loss_delimiter === 14) ||
      (average === 0 && delimiter + find.loss_delimiter === 7)
    ) {
      const pos =
        payload.average.position === -1
          ? '1000+'
          : payload.average.position === -2
            ? 'Нет данных'
            : '1000+';

      await this.averageRepository.findOneAndUpdate(
        { _id: payload.id },
        { average: pos, start_position: null, cpm: null },
      );

      return find.delimiter === 14;
    }

    return find.delimiter === 14;
  }

  async updateDiff(average) {
    const first = average.at(1);
    const second = average.at(0);
    const data = await this.mathUtils.calculateDiff(
      { position: second.average },
      { position: first.average },
    );

    await this.averageRepository.findOneAndUpdate(
      {
        _id: second._id,
      },
      {
        $set: { difference: data },
      },
    );
  }

  async checkAndUpdate(_id: Types.ObjectId) {
    const date = await this.mathUtils.currentDate();
    const average = await this.averageRepository.findOne({ _id });
    if (average.timestamp === date) {
      await this.averageRepository.findOneAndUpdate({ _id }, {
        $set: {
          average: 'Ожидается',
          delimiter: 0,
          loss_delimiter: 0,
          difference: '0',
        }
      })
    } else {
      return await this.averageRepository.create({
        average: 'Ожидается',
        userId: average.userId,
        delimiter: 0,
        loss_delimiter: 0,
        difference: '0',
        timestamp: date,
      });
    }
  }
}
