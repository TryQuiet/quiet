import { Module } from '@nestjs/common'
import { SocketModule } from '../socket/socket.module'
import { CaptchaService } from './captcha.service'

@Module({
  imports: [SocketModule],
  providers: [CaptchaService],
  exports: [CaptchaService],
})
export class CaptchaModule {}
