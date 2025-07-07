import { Module } from '@nestjs/common'
import { ImageCompressionService } from './image-compression.service'

@Module({
  providers: [ImageCompressionService],
  exports: [ImageCompressionService],
})
export class ImageCompressionModule {}
