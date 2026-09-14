export enum TorInitState {
  STARTING = 'starting',
  STARTED = 'started',
  NOT_STARTED = 'not-started',
}

export enum ServiceState {
  DEFAULT = 'notStarted',
  LAUNCHING = 'launching',
  LAUNCHED = 'launched',
}

/** A failure which is meaningful to the admission recovery flow. */
export type AdmissionFailureKind = 'timeout' | 'cancelled'

export class AdmissionError extends Error {
  constructor(
    public readonly kind: AdmissionFailureKind,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message)
    this.name = 'AdmissionError'
  }
}
