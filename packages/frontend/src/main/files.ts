import path from 'path'

export const openFiles = (paths: string[]) => {
  const data = {}
  paths.forEach((filePath: string) => {
    const id = `${Date.now()}_${Math.random().toString(36).substring(0, 20)}`
    data[id] = {
      path: filePath,
      name: path.basename(filePath, path.extname(filePath)),
      ext: path.extname(filePath)
    }
  })
  return data
}
