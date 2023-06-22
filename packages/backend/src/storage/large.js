const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

function createLargeFile() {
  const stream = fs.createWriteStream(path.join(__dirname, '/testUtils/large-file.txt'))
  const max = 10000
  let i = 0
  stream.on('open', () => {
    while (i < max) {
      stream.write(crypto.randomBytes(2 * 65536).toString('hex'))
      i++
      // console.log('i ', i)
    }
    stream.end()
  })
}

createLargeFile()
