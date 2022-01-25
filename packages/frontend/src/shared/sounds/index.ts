/* global Audio */
import { soundType } from '../static'
export const direct = new Audio(require('./direct.mp3'))
export const relentless = new Audio(require('./relentless.mp3'))
export const sharp = new Audio(require('./sharp.mp3'))

export const soundTypeToAudio = {
  [soundType.BANG]: sharp,
  [soundType.POW]: direct,
  [soundType.SPLAT]: relentless
}
