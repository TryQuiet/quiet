import { MAX_PROFILE_PHOTO_SIZE_BYTES } from '@quiet/common'

import {
  COMPRESSED_PROFILE_PHOTO_EXT,
  COMPRESSED_PROFILE_PHOTO_NAME,
  MAX_PROFILE_PHOTO_EDGE_PX,
  PROFILE_PHOTO_QUALITY_MAX,
  compressProfilePhoto,
  scaleToFit,
  type DecodedProfilePhoto,
  type ProfilePhotoCodec,
} from './compressProfilePhoto'

/**
 * jsdom has no canvas and no image decoder, so the codec is injected. What is
 * under test is the policy around it: when to re-encode at all, what size to
 * draw at, and which quality to stop on.
 */
const fakeFile = (name: string, type: string, size: number): File => ({ name, type, size }) as File

const fakeBlob = (size: number): Blob => ({ size }) as Blob

const decoded = (width: number, height: number): DecodedProfilePhoto => ({
  width,
  height,
  source: {} as CanvasImageSource,
})

/** A codec whose JPEG size is a plain function of the pixel count and quality. */
const makeCodec = (
  width: number,
  height: number,
  sizeFor: (w: number, h: number, quality: number) => number
): ProfilePhotoCodec & { encodeCalls: Array<{ width: number; height: number; quality: number }> } => {
  const encodeCalls: Array<{ width: number; height: number; quality: number }> = []
  return {
    encodeCalls,
    decode: jest.fn(async () => decoded(width, height)),
    encode: jest.fn(async (_d, w, h, quality) => {
      encodeCalls.push({ width: w, height: h, quality })
      return fakeBlob(sizeFor(w, h, quality))
    }),
  }
}

const OVER = MAX_PROFILE_PHOTO_SIZE_BYTES + 1

describe('scaleToFit', () => {
  it('leaves an image that already fits alone', () => {
    expect(scaleToFit(300, 200, 512)).toEqual({ width: 300, height: 200 })
  })

  it('scales the long edge down and keeps the aspect ratio', () => {
    expect(scaleToFit(2000, 1000, 512)).toEqual({ width: 512, height: 256 })
    expect(scaleToFit(1000, 2000, 512)).toEqual({ width: 256, height: 512 })
  })

  it('never produces a zero-width image', () => {
    expect(scaleToFit(10000, 1, 512)).toEqual({ width: 512, height: 1 })
  })
})

describe('compressProfilePhoto', () => {
  it('passes an image that already fits through untouched, without decoding it', async () => {
    const file = fakeFile('small.png', 'image/png', MAX_PROFILE_PHOTO_SIZE_BYTES)
    const codec = makeCodec(100, 100, () => 10)

    const result = await compressProfilePhoto(file, codec)

    expect(result).toEqual({ compressed: false, file })
    expect(codec.decode).not.toHaveBeenCalled()
    expect(codec.encode).not.toHaveBeenCalled()
  })

  it('re-encodes an oversized image at the target long edge', async () => {
    const file = fakeFile('huge.png', 'image/png', 8 * 1024 * 1024)
    const codec = makeCodec(2000, 1500, () => 1000)

    const result = await compressProfilePhoto(file, codec)

    expect(result).toMatchObject({
      compressed: true,
      photo: {
        name: COMPRESSED_PROFILE_PHOTO_NAME,
        ext: COMPRESSED_PROFILE_PHOTO_EXT,
        width: MAX_PROFILE_PHOTO_EDGE_PX,
        height: 384,
        quality: PROFILE_PHOTO_QUALITY_MAX,
      },
    })
    expect(codec.encodeCalls).toHaveLength(1)
  })

  it('steps the quality down and stops on the first encode that fits', async () => {
    const file = fakeFile('huge.jpg', 'image/jpeg', 8 * 1024 * 1024)
    // Only quality <= 0.76 (the third rung) comes in under budget.
    const codec = makeCodec(2000, 2000, (_w, _h, quality) => (quality <= 0.76 ? MAX_PROFILE_PHOTO_SIZE_BYTES : OVER))

    const result = await compressProfilePhoto(file, codec)

    expect(result).toMatchObject({ compressed: true, photo: { quality: 0.76, width: 512, height: 512 } })
    expect(codec.encodeCalls.map(c => c.quality)).toEqual([0.92, 0.84, 0.76])
  })

  it('halves the long edge once when the whole quality ladder is over budget', async () => {
    const file = fakeFile('huge.jpg', 'image/jpeg', 20 * 1024 * 1024)
    const halved = Math.round(MAX_PROFILE_PHOTO_EDGE_PX / 2)
    const codec = makeCodec(4000, 4000, w => (w <= halved ? 1000 : OVER))

    const result = await compressProfilePhoto(file, codec)

    expect(result).toMatchObject({ compressed: true, photo: { width: halved, height: halved, quality: 0.92 } })
    // Full ladder at 512, then the first rung at 256.
    expect(codec.encodeCalls.filter(c => c.width === MAX_PROFILE_PHOTO_EDGE_PX)).toHaveLength(6)
    expect(codec.encodeCalls[codec.encodeCalls.length - 1]).toEqual({ width: halved, height: halved, quality: 0.92 })
  })

  it('gives up when even the halved image is over budget', async () => {
    const file = fakeFile('huge.jpg', 'image/jpeg', 200 * 1024 * 1024)
    const codec = makeCodec(4000, 4000, () => OVER)

    expect(await compressProfilePhoto(file, codec)).toBeNull()
  })

  it('returns null when the file cannot be decoded', async () => {
    const file = fakeFile('broken.png', 'image/png', 5 * 1024 * 1024)
    const codec: ProfilePhotoCodec = {
      decode: jest.fn(async () => {
        throw new Error('not an image')
      }),
      encode: jest.fn(async () => fakeBlob(10)),
    }

    expect(await compressProfilePhoto(file, codec)).toBeNull()
    expect(codec.encode).not.toHaveBeenCalled()
  })

  it('returns null when the decoder reports a zero-sized image', async () => {
    const file = fakeFile('empty.png', 'image/png', 5 * 1024 * 1024)
    const codec = makeCodec(0, 0, () => 10)

    expect(await compressProfilePhoto(file, codec)).toBeNull()
  })

  it('does not pass a small non-image through; it tries to decode it and fails', async () => {
    const file = fakeFile('notreally.jpg', 'text/plain', 1024)
    const codec: ProfilePhotoCodec = {
      decode: jest.fn(async () => {
        throw new Error('not an image')
      }),
      encode: jest.fn(async () => fakeBlob(10)),
    }

    expect(await compressProfilePhoto(file, codec)).toBeNull()
    expect(codec.decode).toHaveBeenCalled()
  })

  it('returns null when the encoder yields no blob', async () => {
    const file = fakeFile('huge.png', 'image/png', 5 * 1024 * 1024)
    const codec: ProfilePhotoCodec = {
      decode: jest.fn(async () => decoded(1000, 1000)),
      encode: jest.fn(async () => null),
    }

    expect(await compressProfilePhoto(file, codec)).toBeNull()
  })
})
