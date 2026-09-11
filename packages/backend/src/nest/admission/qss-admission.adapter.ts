import { Injectable } from '@nestjs/common'
import { QSSService } from '../qss/qss.service'
import { QSSOperationResult } from '../qss/qss.types'
import { AdmissionAttempt, AdmissionAttemptOptions, AdmissionError, PreparedQssAdmission } from './admission.types'

@Injectable()
export class QssAdmissionAdapter {
  constructor(private readonly qss: QSSService) {}

  create({ context, scope, lease }: AdmissionAttemptOptions): AdmissionAttempt {
    let prepared: PreparedQssAdmission | undefined
    // The launch lease grants exclusive ownership of QSS during acquisition.
    scope.own(() => {
      this.qss.pause()
    })
    return {
      context,
      prepare: () =>
        scope.run(async () => {
          if (lease.qssEndpoint == null) throw new AdmissionError('availability', 'QSS endpoint is unavailable')
          const result = await this.qss.connectForAdmission(lease.qssEndpoint)
          scope.assertCurrent()
          if (result !== QSSOperationResult.SUCCESS)
            throw new AdmissionError('availability', 'QSS connection unavailable')
          prepared = await this.qss.prepareAdmission(context.request.teamId, context.chain)
          scope.assertCurrent()
        }),
      start: () =>
        scope.run(async () => {
          if (prepared == null) throw new AdmissionError('protocol', 'QSS admission was not prepared')
          await this.qss.startPreparedAdmission(prepared, context)
        }),
      stop: reason => scope.drain(reason),
    }
  }
}
