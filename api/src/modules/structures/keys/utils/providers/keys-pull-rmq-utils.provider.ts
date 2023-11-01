import { Injectable } from '@nestjs/common';
import { PeriodsDocument } from 'src/modules/structures/periods';
import { IPullIdsResponse, IPvzRMQSendStructure } from '../../types';
import { Types } from 'mongoose';
import { PvzDocument } from 'src/modules/structures/pvz';
import { map } from 'lodash';
import { KeysDocument } from '../../schemas';

@Injectable()
export class KeysPullRmqUtilsProvider {
  public async pullIds(document: KeysDocument): Promise<IPullIdsResponse> {
    const documentsPvz = document.pwz as unknown as PvzDocument[];
    const lastAverage = await this.getLastDocument(document.average);

    const dataPvz = await this.destructurePvz(documentsPvz, lastAverage);

    return {
      send_data: {
        article: document.article,
        key_id: document._id,
        key: document.key,
        pvz: dataPvz,
      },
      average: lastAverage,
    };
  }

  private async destructurePvz(
    array: Array<PvzDocument>,
    average: Types.ObjectId,
  ): Promise<IPvzRMQSendStructure[]> {
    const result = map(array, async element => {
      const positionDocument = (await this.getLastDocument(
        element.position,
      )) as unknown as PeriodsDocument;
      const position = await this.positionDataDefinition(positionDocument);
      return {
        name: element.name,
        average_id: average._id,
        addressId: element._id,
        geo_address_id: element.geo_address_id,
        periodId: positionDocument._id,
        current_position: position,
      } as IPvzRMQSendStructure;
    });

    return await Promise.all(result);
  }

  private async getLastDocument<T>(array: Array<T>): Promise<T> {
    return array.at(-1);
  }

  private async positionDataDefinition(document: PeriodsDocument): Promise<string> {
    const unspecifiedPositionType =
      document.position === '1000+' ||
      document.position === 'Нет данных' ||
      document.position === 'Ожидается';

    if (document.cpm || document.promo_position) {
      return document.promo_position;
    } else if (unspecifiedPositionType) {
      return '0';
    } else if (!document.cpm || !document.promo_position) {
      return document.position;
    }
  }
}
