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
  startP2p(finalize: AdmissionFinalizer): Promise<AdmissionResult>
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
}

export type AdmissionFinalizer = (candidate: AdmissionCandidate) => Promise<AdmissionResult>

export interface PreparedQssAdmission {
  teamId: string
  kind: AdmissionKind
}

export type CommunityAdmissionMetadata = {
  admissionTransport?: AdmissionTransport
}
