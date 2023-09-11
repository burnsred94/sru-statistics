import { User } from 'src/modules/auth/user';

export interface IKey {
  keys: string[];
  userId: User;
  article: string;
  pvz: IDestructure[];
}

export interface IDestructure {
  addressId: string;
  address: string;
  city: string;
  city_id: string;
}

