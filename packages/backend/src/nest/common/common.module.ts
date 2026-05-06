import { forwardRef, Module } from '@nestjs/common'
import { Serializer } from './serializer.service'

@Module({
  imports: [],
  providers: [Serializer],
  exports: [Serializer],
})
export class CommonModule {}
