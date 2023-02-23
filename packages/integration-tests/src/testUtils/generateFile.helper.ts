import fs from 'fs'
import crypto from 'crypto'

export function createFile(filePath: string, size: number) {
    const stream = fs.createWriteStream(filePath)
    const maxChunkSize = 51048576 // 1MB
    stream.on('open', () => {
      if (size < maxChunkSize) {
        stream.write(crypto.randomBytes(size))
      } else {
        const chunks = Math.floor(size / maxChunkSize)
        for (let i = 0; i < chunks; i++) {
          if (size < maxChunkSize) {
            stream.write(crypto.randomBytes(size))
          } else {
            stream.write(crypto.randomBytes(maxChunkSize))
          }
          size -= maxChunkSize
        }
      }
      stream.end()
    })
  }

export const createEmptyFileOfSize = async (fileName, size) => {
  return await new Promise((resolve, reject) => {
    setTimeout(() => {
        try {
          const fd = fs.openSync(fileName, 'w')
          if (size > 0) {
              fs.writeSync(fd, Buffer.alloc(1), 0, 1, size - 1)
          }
          fs.closeSync(fd)
          resolve(true)
        } catch (error) {
          reject(error)
        }
    }, 0)
  })
}
