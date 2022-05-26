/* global Audio */
export const direct = new Audio(require('./direct.mp3'))
export const relentless = new Audio(require('./relentless.mp3'))
export const sharp = new Audio(require('./sharp.mp3'))

export const soundTypeToAudio = {
  bang: sharp,
  pow: direct,
  splat: relentless
}
