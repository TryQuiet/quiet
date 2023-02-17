/* global Audio */
export const direct = new Audio(require('./direct.mp3').default)
export const relentless = new Audio(require('./relentless.mp3').default)
export const sharp = new Audio(require('./sharp.mp3').default)
export const librarianShhh = new Audio(require('./librarianShhh.mp3').default)

export const soundTypeToAudio = {
  bang: sharp,
  pow: direct,
  splat: relentless,
  librarianShhh: librarianShhh
}
