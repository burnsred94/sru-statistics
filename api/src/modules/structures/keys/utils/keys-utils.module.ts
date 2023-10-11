import { Module } from '@nestjs/common';
import { KeysPullRmqUtilsProvider, KeysUpdatedRMQUtils } from './providers';
import { KeysUtilsFacade } from './keys-utils.facade';
import { AverageModule } from '../../average';
import { PvzModule } from '../../pvz';

const PROVIDERS = [KeysPullRmqUtilsProvider, KeysUpdatedRMQUtils];

@Module({
  imports: [AverageModule, PvzModule],
  providers: [KeysUtilsFacade, ...PROVIDERS],
  exports: [KeysUtilsFacade],
})
export class KeysUtilsModule {}
