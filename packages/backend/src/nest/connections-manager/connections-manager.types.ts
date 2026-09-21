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

export type AdmissionResetReceipt = {
  id: string
  invitationType: 'device' | 'community'
  phase: 'pending' | 'complete'
}
