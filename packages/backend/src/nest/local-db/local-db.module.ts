import { Module } from '@nestjs/common'
import { LocalDbService } from './local-db.service'

@Module({
    providers: [LocalDbService],
    exports: [LocalDbService],
})
export class LocalDbModule {}
