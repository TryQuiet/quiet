import { Module } from '@nestjs/common'
import { DB_PATH, LEVEL_DB, QUIET_DIR } from '../const'
import { LocalDbService } from './local-db.service'
import { Level } from 'level'
import path from 'path'

@Module({
  providers: [LocalDbService,
    {
      provide: LEVEL_DB,
      useFactory: (dbPath: string) => new Level<string, any>(dbPath, { valueEncoding: 'json' }),
      inject: [DB_PATH]
    },
    {
      provide: DB_PATH,
      useFactory: (baseDir: string) => path.join(baseDir, 'backendDB'),
      inject: [QUIET_DIR]
    },
  ],
  exports: [LocalDbService]
})
export class LocalDbModule {}
