const fs = require('fs')
const crypto = require('crypto')
const yaml = require('js-yaml')
const glob = require('glob')
const path = require('path')

let appImagePath

function checksum(file = appImagePath, algorithm = 'sha512', encoding = 'base64', options) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash(algorithm)
    hash.on('error', reject).setEncoding(encoding)
    fs.createReadStream(
      file,
      Object.assign({}, options, {
        highWaterMark: 1024 * 1024
      })
    )
      .on('error', reject)
      .on('end', () => {
        hash.end()
        resolve(hash.read())
      })
      .pipe(hash, {
        end: false
      })
  })
}

const main = async () => {
  const newChecksum = await checksum()
  try {
    const isPrerelease = fs.existsSync(path.join(process.cwd(), '/dist/alpha-linux.yml'))
    const filePath = isPrerelease ? '/dist/alpha-linux.yml' : '/dist/latest-linux.yml'
    
    let fileContents = fs.readFileSync(path.join(process.cwd(), filePath), 'utf8')
    let data = yaml.load(fileContents)

    data.files[0].sha512 = newChecksum
    data.sha512 = newChecksum

    let yamlStr = yaml.dump(data)
    fs.writeFileSync(path.join(process.cwd(), filePath), yamlStr, 'utf8')
  } catch (e) {
    console.log('ERROR: ', e)
    throw new Error(e)
  }
}

glob('**/*.AppImage', {}, (err, files) => {
  appImagePath = files[1]
  main()
})
