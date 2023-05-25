import { NotificationsSounds } from '@quiet/state-manager'

/* global Audio */
export const direct = new Audio(require('./direct.mp3').default)
export const relentless = new Audio(require('./relentless.mp3').default)
export const sharp = new Audio(require('./sharp.mp3').default)
export const librarianShhh = new Audio(require('./librarianShhh.mp3').default)

export const soundTypeToAudio = {
  [NotificationsSounds.bang]: sharp,
  [NotificationsSounds.pow]: direct,
  [NotificationsSounds.splat]: relentless,
  [NotificationsSounds.librarianShhh]: librarianShhh,
  [NotificationsSounds.none]: null,
}
