import { IPaginationResponse } from 'src/modules/utils/types';

export interface IManyFolderResponse extends IPaginationResponse {
  count_keys: number;
}
