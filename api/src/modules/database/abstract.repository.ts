import { Document, FilterQuery, Model, PopulateOptions, UpdateQuery } from 'mongoose';

export abstract class AbstractRepository<T extends Document> {
  constructor(protected readonly abstractModel: Model<T>) { }

  async findOne(
    filterQuery: FilterQuery<T>,
    populate?: PopulateOptions
  ): Promise<T | null> {
    return populate === undefined ? await this.abstractModel.findOne(filterQuery)
      .lean()
      : await this.abstractModel.findOne(filterQuery)
        .populate(populate)
        .lean();
  }

  async find(filterQuery?: FilterQuery<T>, populate?: PopulateOptions): Promise<T[] | null> {
    return populate === undefined ?
      await this.abstractModel.find(filterQuery)
        .populate(populate)
        .lean()
      : await this.abstractModel.find(filterQuery)
        .lean()
  }

  async create(createEntityData: unknown, populate?: PopulateOptions): Promise<T | null> {
    const entity = new this.abstractModel(createEntityData);
    const create = await entity.save()
    return populate ? create.populate(populate) : create;
  }

  async findOneAndUpdate(
    filterQuery: FilterQuery<T>,
    updateEntityData: UpdateQuery<unknown>,
  ): Promise<T | null> {
    return await this.abstractModel.findOneAndUpdate(filterQuery, updateEntityData, {
      new: true,
    });
  }

  async deleteMany(filterQuery: FilterQuery<T>): Promise<boolean> {
    const result = await this.abstractModel.deleteMany(filterQuery);
    return result.deletedCount >= 0;
  }

  async updateMany(filterQuery: FilterQuery<T>, updateQuery: UpdateQuery<unknown>): Promise<boolean> {
    const result = await this.abstractModel.updateMany(filterQuery, updateQuery);
    return result.modifiedCount > 0;
  }

  async getCountDocuments(filterQuery: FilterQuery<T>): Promise<number> {
    return await this.abstractModel.countDocuments(filterQuery);
  }
}
