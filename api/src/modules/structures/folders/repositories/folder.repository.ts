import { AbstractRepository } from 'src/modules/database';
import { Folder, FolderDocument } from '../schemas';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from 'src/modules/auth';
import { MetricsEnum } from '../../article';

export class FolderRepository extends AbstractRepository<FolderDocument> {
  constructor(@InjectModel(Folder.name) readonly folderModel: Model<FolderDocument>) {
    super(folderModel);
  }

  async findList(
    user: User,
    article: Types.ObjectId,
    query?: { search: string },
  ): Promise<FolderDocument[] | any[]> {
    let search = {};

    if (query.search !== undefined) search = { name: { $regex: query.search, $options: 'i' } };

    const result = await this.folderModel.aggregate([
      { $match: { user, article_id: article, ...search } },
      {
        $lookup: {
          from: 'keys',
          localField: 'keys',
          foreignField: '_id',
          as: 'keys',
        },
      },
      { $unwind: { path: '$keys', preserveNullAndEmptyArrays: true } },
      {
        $match: {
          $or: [{ 'keys.active': true }, { keys: { $exists: false } }, { keys: { $size: 0 } }],
        },
      },
      {
        $lookup: {
          from: 'metrics',
          localField: '_id',
          foreignField: 'folder',
          as: 'metrics',
        },
      },
      { $unwind: '$metrics' },
      {
        $group: {
          _id: '$_id',
          name: { $first: '$name' },
          user: { $first: '$user' },
          metrics: { $first: '$metrics' },
          sum_frequency: { $sum: '$keys.frequency' },
          createdAt: { $first: '$createdAt' },
          updatedAt: { $first: '$updatedAt' },
          keys: { $push: '$keys' },
        },
      },
      {
        $project: {
          _id: 1,
          user: 1,
          name: 1,
          sum_frequency: 1,
          keys: { $size: '$keys' },
          createdAt: 1,
          updatedAt: 1,
          middle_pos_organic: {
            num: { $arrayElemAt: ['$metrics.middle_pos_organic.met', -1] },
            data: { $slice: ['$metrics.middle_pos_organic', -15] },
            color_metrics: {
              $cond: {
                if: {
                  $eq: [
                    { $arrayElemAt: ['$metrics.middle_pos_organic.met', 0] },
                    { $arrayElemAt: ['$metrics.middle_pos_organic.met', -1] },
                  ],
                },
                then: MetricsEnum.NEUTRAL,
                else: {
                  $cond: {
                    if: {
                      $gt: [
                        { $arrayElemAt: ['$metrics.middle_pos_organic.met', 0] },
                        { $arrayElemAt: ['$metrics.middle_pos_organic.met', -1] },
                      ],
                    },
                    then: MetricsEnum.DOWN,
                    else: MetricsEnum.UP,
                  },
                },
              },
            },
          },
          middle_pos_adverts: {
            num: { $arrayElemAt: ['$metrics.middle_pos_adverts.met', -1] },
            data: { $slice: ['$metrics.middle_pos_adverts', -15] },
            color_metrics: {
              $cond: {
                if: {
                  $eq: [
                    { $arrayElemAt: ['$metrics.middle_pos_adverts.met', 0] },
                    { $arrayElemAt: ['$metrics.middle_pos_adverts.met', -1] },
                  ],
                },
                then: MetricsEnum.NEUTRAL,
                else: {
                  $cond: {
                    if: {
                      $gt: [
                        { $arrayElemAt: ['$metrics.middle_pos_adverts.met', 0] },
                        { $arrayElemAt: ['$metrics.middle_pos_adverts.met', -1] },
                      ],
                    },
                    then: MetricsEnum.UP,
                    else: MetricsEnum.DOWN,
                  },
                },
              },
            },
          },
          trend: { $slice: ['$metrics.indexes', -15] },
        },
      },
    ]);

    return result as FolderDocument[];
  }

}
