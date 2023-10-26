import { Injectable } from "@nestjs/common";
import { from, map } from "rxjs";
import { KeyBuilder, KeysService } from "src/modules/structures/keys";

@Injectable()
export class KeywordRefreshService {

    constructor(private readonly keywordBuilder: KeyBuilder, private readonly keywordService: KeysService) { }

    async updateNight() {
        const keywords = await this.keywordService.find({
            active: true,
            $or: [{ active_sub: true }, { active_sub: { $exists: false } }],
        })

        from(keywords)
            .pipe(map((value) => {
                return value
            }))
            .subscribe({
                next: (value) => {
                    this.keywordBuilder
                        .getFrequency(value.key)
                        .initialUpdateData(value)
                }
            })
    }
}