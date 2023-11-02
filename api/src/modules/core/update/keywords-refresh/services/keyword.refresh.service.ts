import { Injectable, Logger } from '@nestjs/common';
import { HydratedDocument } from 'mongoose';
import { concatMap, from } from 'rxjs';
import { KeyBuilder, Keys, KeysService } from 'src/modules/structures/keys';

@Injectable()
export class KeywordRefreshService {
  protected readonly logger = new Logger(KeywordRefreshService.name)
  constructor(
    private readonly keywordBuilder: KeyBuilder,
    private readonly keywordService: KeysService,
  ) { }

  async updateNight() {
    const keywords = await this.keywordService.find({
      active: true,
      active_sub: true,
    });

    const callback = (() => true)

    from(keywords)
      .pipe(
        concatMap(async (value) => {
          return new Promise<[HydratedDocument<Keys>, () => boolean]>((resolve) => {
            setTimeout(() => {
              console.log(keywords.length)
              this.keywordBuilder
                .getFrequency(value.key)
                .initialUpdateData(value, resolve([value, callback]));
            }, 350)
          })
        }),
      )
      .subscribe({
        next: ([value, result]) => {
          this.logger.log(`Update ${value._id} status: ${result}`)
        },
      });
  }

}
