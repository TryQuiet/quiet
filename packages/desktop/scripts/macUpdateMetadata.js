const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const expectedFiles = {
  x64: version => [`Quiet-${version}-mac.zip`, `Quiet-${version}.dmg`],
  arm64: version => [`Quiet-${version}-arm64-mac.zip`, `Quiet-${version}-arm64.dmg`],
}

const parseArgs = argv => {
  const result = {}
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]
    const value = argv[i + 1]
    if (!key?.startsWith('--') || value == null) {
      throw new Error(`Invalid argument list: ${argv.join(' ')}`)
    }
    result[key.slice(2)] = value
  }
  return result
}

const requireArg = (args, name) => {
  const value = args[name]
  if (!value) {
    throw new Error(`Missing required argument --${name}`)
  }
  return value
}

const checksum = file => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha512')
    fs.createReadStream(file)
      .on('error', reject)
      .on('data', chunk => hash.update(chunk))
      .on('end', () => resolve(hash.digest('base64')))
  })
}

const ensureDirectory = file => {
  fs.mkdirSync(path.dirname(file), { recursive: true })
}

const collect = async args => {
  const arch = requireArg(args, 'arch')
  const version = requireArg(args, 'version')
  const distDir = requireArg(args, 'dist-dir')
  const output = requireArg(args, 'output')
  const getFiles = expectedFiles[arch]

  if (!getFiles) {
    throw new Error(`Unsupported mac architecture: ${arch}`)
  }

  const files = []
  for (const fileName of getFiles(version)) {
    const file = path.join(distDir, fileName)
    if (!fs.existsSync(file)) {
      throw new Error(`Expected mac update artifact does not exist: ${file}`)
    }
    const stats = fs.statSync(file)
    files.push({
      url: fileName,
      sha512: await checksum(file),
      size: stats.size,
    })
  }

  ensureDirectory(output)
  fs.writeFileSync(output, `${JSON.stringify({ arch, version, files }, null, 2)}\n`)
}

const walk = directory => {
  const entries = fs.readdirSync(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...walk(entryPath))
    } else {
      files.push(entryPath)
    }
  }
  return files
}

const readArchInfo = (inputDir, arch) => {
  const matches = walk(inputDir).filter(file => path.basename(file) === `${arch}.json`)
  if (matches.length !== 1) {
    throw new Error(`Expected exactly one ${arch}.json in ${inputDir}, found ${matches.length}`)
  }
  return JSON.parse(fs.readFileSync(matches[0], 'utf8'))
}

const byExtension = extension => file => file.url.endsWith(extension)

const quote = value => JSON.stringify(String(value))

const serializeUpdateInfo = updateInfo => {
  const lines = [`version: ${quote(updateInfo.version)}`, 'files:']
  for (const file of updateInfo.files) {
    lines.push(`  - url: ${quote(file.url)}`)
    lines.push(`    sha512: ${quote(file.sha512)}`)
    lines.push(`    size: ${file.size}`)
  }
  lines.push(`path: ${quote(updateInfo.path)}`)
  lines.push(`sha512: ${quote(updateInfo.sha512)}`)
  lines.push(`releaseDate: ${quote(updateInfo.releaseDate)}`)
  return `${lines.join('\n')}\n`
}

const merge = args => {
  const version = requireArg(args, 'version')
  const inputDir = requireArg(args, 'input-dir')
  const output = requireArg(args, 'output')
  const objectsOutput = requireArg(args, 'objects-output')

  const x64 = readArchInfo(inputDir, 'x64')
  const arm64 = readArchInfo(inputDir, 'arm64')

  for (const archInfo of [x64, arm64]) {
    if (archInfo.version !== version) {
      throw new Error(`Unexpected ${archInfo.arch} metadata version: ${archInfo.version}, expected ${version}`)
    }
  }

  const files = [
    ...x64.files.filter(byExtension('.zip')),
    ...arm64.files.filter(byExtension('.zip')),
    ...x64.files.filter(byExtension('.dmg')),
    ...arm64.files.filter(byExtension('.dmg')),
  ]
  const urls = files.map(file => file.url)
  const duplicate = urls.find((url, index) => urls.indexOf(url) !== index)
  if (duplicate) {
    throw new Error(`Duplicate mac update artifact in metadata: ${duplicate}`)
  }

  const primaryFile = files.find(byExtension('.zip'))
  if (!primaryFile) {
    throw new Error('Combined mac update metadata does not contain a zip file')
  }

  const updateInfo = {
    version,
    files,
    path: primaryFile.url,
    sha512: primaryFile.sha512,
    releaseDate: new Date().toISOString(),
  }

  ensureDirectory(output)
  ensureDirectory(objectsOutput)
  fs.writeFileSync(output, serializeUpdateInfo(updateInfo))
  fs.writeFileSync(objectsOutput, `${urls.join('\n')}\n`)
}

const disablePublish = args => {
  const packagePath = requireArg(args, 'package')
  const bucket = requireArg(args, 'bucket')
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
  const publish = pkg.build?.publish

  if (publish == null || Array.isArray(publish) || typeof publish !== 'object') {
    throw new Error('Expected package.json build.publish to be a single publish configuration object')
  }

  pkg.build.publish = {
    ...publish,
    bucket,
    publishAutoUpdate: false,
  }

  fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`)
}

const main = async () => {
  const command = process.argv[2]
  const args = parseArgs(process.argv.slice(3))

  if (command === 'collect') {
    await collect(args)
  } else if (command === 'merge') {
    merge(args)
  } else if (command === 'disable-publish') {
    disablePublish(args)
  } else {
    throw new Error(`Unknown command: ${command}`)
  }
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
