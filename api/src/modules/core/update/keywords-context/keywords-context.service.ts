import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { STRATEGY_REFRESH } from './types';
import { HydratedDocument } from 'mongoose';
import { Keys } from 'src/modules/structures/keys';
import { KeywordsDataContextStrategy, KeywordsNightRefresh } from './strategies';

export interface IKeywordsContext {
  sendToQueue(keyword: HydratedDocument<Keys> | HydratedDocument<Keys>[]): void;
}

@Injectable()
export class KeywordsContextService {
  protected logger = new Logger(KeywordsContextService.name);
  protected readonly strategy: STRATEGY_REFRESH;
  protected processor: KeywordsDataContextStrategy | KeywordsNightRefresh;

  constructor(
    @Inject(STRATEGY_REFRESH.KEYWORDS_DATA_REFRESH)
    @Optional()
    private keywordsDataRefresh: KeywordsDataContextStrategy,
    @Inject(STRATEGY_REFRESH.KEYWORDS_NIGHT_REFRESH)
    @Optional()
    private keywordsNightRefresh: KeywordsNightRefresh,
  ) {
    this.currentStrategy();
  }

  private async currentStrategy() {
    this.logger.log(`Current strategy: ${this.currentStrategy.name}`);
  }

  setProcessor(process: STRATEGY_REFRESH): void {
    switch (process) {
      case STRATEGY_REFRESH.KEYWORDS_DATA_REFRESH: {
        this.processor = this.keywordsDataRefresh;
        break;
      }
      case STRATEGY_REFRESH.KEYWORDS_NIGHT_REFRESH: {
        this.processor = this.keywordsNightRefresh;
        break;
      }
    }
  }

  refresh(keywords: HydratedDocument<Keys> | HydratedDocument<Keys>[]) {
    if (this.processor instanceof KeywordsDataContextStrategy) {
      const data = keywords as HydratedDocument<Keys>;
      this.processor.sendToQueue(data);
    } else if (this.processor instanceof KeywordsNightRefresh) {
      const data = keywords as HydratedDocument<Keys>[];
      this.processor.sendToQueue(data);
    }
  }
}
