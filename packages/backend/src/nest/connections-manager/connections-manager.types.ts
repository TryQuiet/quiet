import { HiddenService } from '@quiet/types'
import PeerId from 'peer-id'

export enum TorInitState{
    STARTING = 'starting',
    STARTED = 'started',
    NOT_STARTED = 'not-started'
  }
  export enum ServiceState {
    DEFAULT = 'notStarted',
    LAUNCHING = 'launching',
    LAUNCHED = 'launched'
  }
  export interface NetworkData {
    hiddenService: HiddenService
    peerId: PeerId
  }
