import { Injectable } from '@nestjs/common'
import { performance } from 'perf_hooks'
@Injectable()
export class AdmissionClock {
  now(): number {
    return performance.now()
  }
  after(ms: number, callback: () => void): NodeJS.Timeout {
    return setTimeout(callback, ms)
  }
  clear(timer?: NodeJS.Timeout): void {
    if (timer != null) clearTimeout(timer)
  }
}
