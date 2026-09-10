import { Injectable } from '@nestjs/common'
import { Libp2pService } from '../libp2p/libp2p.service'
import { AdmissionAttempt, AdmissionAttemptOptions } from './admission.types'

@Injectable()
export class P2pAdmissionAdapter {
  constructor(private readonly libp2p: Libp2pService) {}

  create({ context, scope, lease }: AdmissionAttemptOptions): AdmissionAttempt {
    scope.own(async () => {
      this.libp2p.clearAdmissionContext(context)
      await this.libp2p.close(false)
    })
    return {
      context,
      prepare: async () => {
        scope.assertCurrent()
      },
      start: () =>
        scope.run(async () => {
          this.libp2p.setAdmissionContext(context)
          await this.libp2p.createInstance(lease.libp2pParams, scope.signal)
          scope.assertCurrent()
        }),
      stop: reason => scope.drain(reason),
    }
  }
}
