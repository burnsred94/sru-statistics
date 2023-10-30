import { Module } from '@nestjs/common';
import { ArticleModule } from 'src/modules/structures/article';
import { MetricsRefreshService } from './services';
import { MetricsModule } from 'src/modules/structures/metrics/metrics.module';
import { FoldersModule } from 'src/modules/structures/folders/folders.module';

@Module({
    imports: [ArticleModule, FoldersModule, MetricsModule],
    providers: [MetricsRefreshService],
    exports: [MetricsRefreshService]
})
export class MetricsRefreshModule { }
