import { Types } from 'mongoose';
import { User } from 'src/modules/auth';
import { IAdaptiveProfile } from 'src/modules/integrations/profiles/types';

export interface IMetricData {
  userId: User;
  addresses: IAdaptiveProfile[];
  article?: Types.ObjectId;
  folder?: Types.ObjectId;
}
