import { AbstractRepository } from 'src/modules/database';
import { Folder, FolderDocument } from '../schemas';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from 'src/modules/auth';

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
        $group: {
          _id: '$_id',
          name: { $first: '$name' },
          user: { $first: '$user' },
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
        },
      },
    ]);

    return result as FolderDocument[];
  }
}
