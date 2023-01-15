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
  if (process.env.NODE_ENV === 'development') {
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
  } else {
    let externalPackagePath = null
    if (process.platform === 'linux') {
      const resourcesPath = process.env.APPDIR
      externalPackagePath = path.join(resourcesPath, `resources/app/node_modules/@quiet/backend/node_modules/${packageName}`)
    } 
    if (process.platform === 'darwin') {
      const resourcesPath = process.env._.split('/MacOS')[0]
      externalPackagePath = path.join(resourcesPath, `Resources/app/node_modules/@quiet/backend/node_modules/${packageName}`)
      console.log('importing external module from', externalPackagePath)
    }
    return eval(`import('${externalPackagePath}')`)
}
}
