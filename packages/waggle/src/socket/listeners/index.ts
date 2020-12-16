import fs from 'fs'
import path from 'path'

const initListeners = (io, connectionManager, git) => {
  const listenersPath = path.resolve(__dirname)
  fs.readdir(listenersPath, (err, files) => {
    if (err) {
      process.exit(1)
    }
    files.map(fileName => {
      if (fileName !== 'index.ts') {
        console.debug("Initializing listener at: %s", fileName)
        const listener = require(path.resolve(__dirname, fileName))
        listener(io, connectionManager, git)
      }
    })
  })
}

export default initListeners
