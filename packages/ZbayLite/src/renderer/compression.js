import zlib from 'zlib'
import util from 'util'

const _deflate = util.promisify(zlib.deflate)
const _unzip = util.promisify(zlib.unzip)

export const deflate = async (inputObj) => {
  const buffer = await _deflate(
    JSON.stringify(inputObj)
  )
  return buffer.toString('base64')
}

export const inflate = async (inputStr) => {
  const buffer = await _unzip(
    Buffer.from(inputStr, 'base64')
  )
  return JSON.parse(buffer.toString())
}
