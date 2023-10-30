import { uniq } from 'lodash';
import { Types } from 'mongoose';

export const keywordsUniq = (keywords: string[]): string[] => uniq(keywords);

export const TransformMongoId = (_id: string): Types.ObjectId => new Types.ObjectId(_id);
