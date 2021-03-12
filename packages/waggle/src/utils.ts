import fs from 'fs'

export function createPaths(paths: string[]) {
    for (const path of paths) {
      if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true })
      }
    }
  }
