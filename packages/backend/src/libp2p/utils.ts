import { formatPEM } from '@quiet/identity'
import { Certificate } from 'pkijs'
import path from 'path'

export function dumpPEM(tag: string, body: string | Certificate | CryptoKey) {
  let bodyCert: string
  if (typeof body === 'string') {
    bodyCert = formatPEM(body)
  } else {
    // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
    // @ts-ignore
    bodyCert = formatPEM(Buffer.from(body).toString('base64'))
  }
  const result = (
    `-----BEGIN ${tag}-----\n` +
    `${bodyCert}\n` +
    `-----END ${tag}-----\n`
  )
  return Buffer.from(result)
}

export async function importDynamically(packageName: string) {
  if (process.env.APPIMAGE) {
    const resourcesPath = process.env.APPDIR
    const externalPackagePath = path.join(resourcesPath, `resources/node_modules/${packageName}`)
    return eval(`import('${externalPackagePath}')`)
  } else {
    switch (packageName) {
      case 'it-ws/dist/src/client.js':
        packageName = 'it-ws/client'
        break
      case 'it-ws/dist/src/server.js':
        packageName = 'it-ws/server'
        break
      case 'p-defer/index.js':
        packageName = 'p-defer'
        break
      case 'p-timeout/index.js':
        packageName = 'p-timeout'
        break
      case 'ipfs-core/src/index.js':
        packageName = 'ipfs-core'
        break
      case 'multiformats/cjs/src/cid.js':
        packageName = 'multiformats/cid'
        break
      default:
        packageName = packageName.split('/dist')[0]
      }

    return eval(`import('${packageName}')`)
}
}
