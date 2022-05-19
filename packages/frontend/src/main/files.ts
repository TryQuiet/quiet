import fs from 'fs'
import path from 'path'

export const openFiles = (paths: Array<string>) => {
  const data = {}
  paths.forEach((filePath: string) => {
    const buffer = fs.readFileSync(filePath)
    const id = `${Date.now()}_${Math.random().toString(36).substring(0,20)}`
    data[id] = {
      name: path.basename(filePath, path.extname(filePath)),
      ext: path.extname(filePath),
      buffer: buffer
    }
  })
  return data
}
