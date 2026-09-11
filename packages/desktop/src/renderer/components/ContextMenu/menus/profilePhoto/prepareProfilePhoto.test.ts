import { prepareProfilePhotoForUpload, type PrepareProfilePhotoDeps } from './prepareProfilePhoto'
import { COMPRESSED_PROFILE_PHOTO_EXT, COMPRESSED_PROFILE_PHOTO_NAME } from './compressProfilePhoto'

const makeBlob = (bytes: number): Blob => {
  const data = new Uint8Array(bytes)
  const blob = new Blob([data])
  // jsdom's Blob predates Blob.arrayBuffer.
  if (typeof (blob as unknown as { arrayBuffer?: unknown }).arrayBuffer !== 'function') {
    Object.defineProperty(blob, 'arrayBuffer', { value: async () => data.buffer })
  }
  return blob
}

const originalFile = (): File => ({ name: 'me.png', type: 'image/png', size: 4 }) as File

const makeDeps = (overrides: Partial<PrepareProfilePhotoDeps> = {}): PrepareProfilePhotoDeps => ({
  compress: jest.fn(async () => null),
  writeTempFile: jest.fn(async () => ({
    path: '/data/temporaryFiles/profile-photo_1.jpg',
    name: 'profile-photo',
    ext: '.jpg',
  })),
  getPathForFile: jest.fn(() => '/home/me/Pictures/me.png'),
  ...overrides,
})

describe('prepareProfilePhotoForUpload', () => {
  it('writes the compressed photo to a temp file and points the upload at it', async () => {
    const file = originalFile()
    const blob = makeBlob(1234)
    const deps = makeDeps({
      compress: jest.fn(async () => ({
        compressed: true as const,
        photo: {
          blob,
          name: COMPRESSED_PROFILE_PHOTO_NAME,
          ext: COMPRESSED_PROFILE_PHOTO_EXT,
          width: 512,
          height: 512,
          quality: 0.92,
        },
      })),
    })

    const prepared = await prepareProfilePhotoForUpload(file, deps)

    expect(deps.writeTempFile).toHaveBeenCalledWith({
      fileName: COMPRESSED_PROFILE_PHOTO_NAME,
      ext: COMPRESSED_PROFILE_PHOTO_EXT,
      fileBuffer: expect.any(Uint8Array),
    })
    expect(prepared.path).toBe('/data/temporaryFiles/profile-photo_1.jpg')
    // The saga derives the attachment extension from the name, so it has to keep one.
    expect(prepared.name).toBe('profile-photo.jpg')
    expect(prepared.size).toBe(1234)
    // The on-disk path of the user's original file is never asked for.
    expect(deps.getPathForFile).not.toHaveBeenCalled()
  })

  it('uploads the original file from disk when the photo already fits', async () => {
    const file = originalFile()
    const deps = makeDeps({ compress: jest.fn(async () => ({ compressed: false as const, file })) })

    const prepared = await prepareProfilePhotoForUpload(file, deps)

    expect(prepared).toBe(file)
    expect(prepared.path).toBe('/home/me/Pictures/me.png')
    expect(deps.writeTempFile).not.toHaveBeenCalled()
  })

  it('falls back to the original file when the photo cannot be compressed', async () => {
    const file = originalFile()
    const deps = makeDeps({ compress: jest.fn(async () => null) })

    const prepared = await prepareProfilePhotoForUpload(file, deps)

    expect(prepared).toBe(file)
    expect(prepared.path).toBe('/home/me/Pictures/me.png')
    expect(deps.writeTempFile).not.toHaveBeenCalled()
  })

  it('falls back to the original file when writing the temp file fails', async () => {
    const file = originalFile()
    const deps = makeDeps({
      compress: jest.fn(async () => ({
        compressed: true as const,
        photo: {
          blob: makeBlob(10),
          name: COMPRESSED_PROFILE_PHOTO_NAME,
          ext: COMPRESSED_PROFILE_PHOTO_EXT,
          width: 512,
          height: 512,
          quality: 0.92,
        },
      })),
      writeTempFile: jest.fn(async () => {
        throw new Error('ipc unavailable')
      }),
    })

    const prepared = await prepareProfilePhotoForUpload(file, deps)

    expect(prepared).toBe(file)
    expect(prepared.path).toBe('/home/me/Pictures/me.png')
  })

  it('falls back to the original file when compression itself throws', async () => {
    const file = originalFile()
    const deps = makeDeps({
      compress: jest.fn(async () => {
        throw new Error('boom')
      }),
    })

    expect(await prepareProfilePhotoForUpload(file, deps)).toBe(file)
  })
})
