import { AdmissionKind } from './admission.types'

/** Keep the real P2P and live QSS lifecycle regressions on the same matrix. */
export const admissionLifecycleCases = [AdmissionKind.MEMBER, AdmissionKind.DEVICE].flatMap(kind =>
  (['uninterrupted', 'pause during commit', 'pause after commit', 'shutdown during commit'] as const).map(
    lifecycle => ({
      kind,
      lifecycle,
    })
  )
)
