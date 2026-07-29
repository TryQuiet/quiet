export enum AdmissionKind {
  MEMBER = 'member',
  DEVICE = 'device',
}

export enum AdmissionTransport {
  QSS = 'qss',
  P2P = 'p2p',
}

export enum QssAdmissionStartResult {
  UNAVAILABLE = 'unavailable',
  READY = 'ready',
}

export type AdmissionPhase =
  'selecting' | 'qss-admitting' | 'p2p-admitting' | 'validating' | 'persisting' | 'admitted' | 'failed' | 'cancelled'

export interface AdmissionRequest {
  communityId: string
  teamId: string
  expectedUserId: string
  expectedDeviceId: string
  kind: AdmissionKind
  preferredTransport: AdmissionTransport
  storedTransport?: AdmissionTransport
  timeoutMs: number
}

export interface AdmissionRuntime {
  startQss(): Promise<QssAdmissionStartResult>
  pauseQss(): void
  startP2p(): Promise<void>
  stopP2p(): Promise<void>
  convergeQssAfterP2p(): Promise<void>
}

export interface AdmissionResult {
  teamId: string
  userId: string
  deviceId: string
  transport: AdmissionTransport
}

export interface AdmissionCandidate {
  transport: AdmissionTransport
  teamId: string
  userId: string
  deviceId: string
  kind: AdmissionKind
  deferUntilPersisted(persistence: Promise<void>): void
}

export interface DeferredAdmissionCandidate {
  candidate: AdmissionCandidate
  waitUntilPersisted(): Promise<void>
}

export interface PreparedQssAdmission {
  teamId: string
  kind: AdmissionKind
}

export type CommunityAdmissionMetadata = {
  admissionTransport?: AdmissionTransport
}

export const createDeferredAdmissionCandidate = (
  candidate: Omit<AdmissionCandidate, 'deferUntilPersisted'>
): DeferredAdmissionCandidate => {
  let persistence: Promise<void> | undefined
  let persistenceAssigned = false

  return {
    candidate: {
      ...candidate,
      deferUntilPersisted(nextPersistence: Promise<void>): void {
        if (persistenceAssigned) {
          return
        }
        persistenceAssigned = true
        persistence = nextPersistence
      },
    },
    waitUntilPersisted: async () => {
      if (!persistenceAssigned || persistence == null) {
        throw new Error('Admission candidate was not claimed')
      }
      await persistence
    },
  }
}
