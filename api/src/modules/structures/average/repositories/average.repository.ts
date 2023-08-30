import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Average } from '../schemas';
import { Model, Types } from 'mongoose';
import { AverageEntity } from '../entities';
import { AverageStatus, IAverage } from 'src/interfaces';

@Injectable()
export class AverageRepository {
  constructor(@InjectModel(Average.name) private readonly averageModel: Model<Average>) { }

  async create(data: IAverage) {
    const averageEntity = new AverageEntity(data);
    const newAverage = await this.averageModel.create(averageEntity);
    return newAverage.save();
  }

  async findOne(id: Types.ObjectId) {
    return await this.averageModel.findOne({ _id: id });
  }

  async refresh(id: Types.ObjectId) {
    return await this.averageModel.findByIdAndUpdate({ _id: id }, {
      $set: {
        average: 'Ожидается',
        delimiter: 0,
        status_updated: AverageStatus.WAIT_SENDING
      }
    })
  }

  async update(id: Types.ObjectId, data: { cpm: number, promotion: number, promoPosition: number, position: number }): Promise<boolean> {
    const find = await this.averageModel.findById({ _id: id })
      .lean()
      .exec();

    const average = Number.isNaN(+find.average) ? 0 : Number(find.average);
    const promo = find.start_position === null ? 0 : Number(find.start_position);
    const delimiter = find.delimiter;


    if (data.position < 0) {
      await this.averageModel.findByIdAndUpdate(
        { _id: id },
        { status_updated: AverageStatus.SUCCESS, $inc: { loss_delimiter: 1 } }
      )
    } else if (data.position > 0) {
      if (data.cpm > 0) {
        const old = (average * delimiter);
        const mathOld = old + data.promoPosition;
        const result = Math.round(mathOld / (delimiter + 1));

        const promoPos = (promo * delimiter);
        const mathPromoPos = promoPos + data.position;
        const resultPromo = Math.round(mathPromoPos / (delimiter + 1));

        await this.averageModel.findByIdAndUpdate(
          { _id: id },
          { average: String(result), start_position: String(resultPromo), cpm: String(data.cpm), status_updated: AverageStatus.SUCCESS, $inc: { delimiter: 1 } },
          { new: true }
        )
      } else {
        const old = (average * delimiter);
        const mathOld = old + data.position;
        const result = Math.round(mathOld / (delimiter + 1));
        await this.averageModel.findByIdAndUpdate(
          { _id: id },
          { average: String(result), status_updated: AverageStatus.SUCCESS, $inc: { delimiter: 1 } },
          { new: true }
        )
      }
    }

    if (delimiter + find.loss_delimiter >= 14 && average === 0) {
      const pos = data.position === -1 ? '1000+' : data.position === -2 ? "Нет данных" : null;

      await this.averageModel.findByIdAndUpdate(
        { _id: id },
        { average: pos, status_updated: AverageStatus.SUCCESS }
      )

      return find.delimiter === 14;

    }

    return find.delimiter === 14;
  }

  async updateDiff(id: Types.ObjectId, data: string) {
    await this.averageModel.findByIdAndUpdate(
      {
        _id: id,
      },
      {
        $set: { difference: data },
      },
    );
  }

  async statusUp(id: Types.ObjectId[], status: AverageStatus) {
    await this.averageModel.updateMany({ _id: id }, { status_updated: status });
  }

  async getCountDocuments(searchObject): Promise<number> {
    return await this.averageModel.countDocuments(searchObject);
  }
}
