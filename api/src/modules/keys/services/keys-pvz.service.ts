import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { forEach } from 'lodash';
import { Types } from 'mongoose';
import { EventsParser } from 'src/modules/article/events';
import { PvzService } from 'src/modules/pvz';
import { KeysRepository } from '../repositories';

@Injectable()
export class KeysPvzService {
  protected readonly logger = new Logger(KeysPvzService.name);

  constructor(
    private readonly pvzService: PvzService,
    private readonly keysRepository: KeysRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async updateFromProfile(data, keys) {
    const { address } = data;

    forEach(keys, async key => {
      const { pwz } = key;
      await this.compareAddress(address, pwz, key);
    });
  }

  async compareAddress(address, pwz, key) {
    const oldIndexAddress = [];
    const newIndexAddress = [];
    const addressesInProcessing = [];

    await forEach(address, async element => {
      const find_pwz_index = pwz.findIndex(
        addressPwz => addressPwz.geo_address_id === element.addressId,
      );
      if (find_pwz_index === -1) {
        const newAddress = this.pvzService.create(element, key.article, key.userId, key._id);
        addressesInProcessing.push(newAddress);
      } else {
        if (pwz[find_pwz_index].active === false) {
          await this.pvzService.initStatus(pwz[find_pwz_index]._id, true);
        }
        newIndexAddress.push(find_pwz_index);
      }
    });

    const resolved = await Promise.all(addressesInProcessing);

    this.eventEmitter.emit(EventsParser.ONE_PWZ_PARSE, { pwzIds: resolved });

    await this.updateKey(key._id, pwz, resolved);

    setImmediate(async () => {
      for (let index = 0; index <= pwz.length - 1; index++) {
        if (!newIndexAddress.includes(index)) {
          oldIndexAddress.push(index);
        }
      }

      await this.removeOldIndex(pwz, oldIndexAddress);
    });
  }

  async updateKey(id, pwz, new_pvz: Types.ObjectId[]) {
    const updated = [...new_pvz];

    for (const index in pwz) {
      updated.push(pwz[index]._id);
    }

    await this.keysRepository.update(id, updated);
  }

  async removeOldIndex(pwz, indexes: number[]) {
    if (indexes.length > 0) {
      for (const index in indexes) {
        await this.pvzService.initStatus(pwz[indexes[index]]._id, false);
      }
    }
  }
}
