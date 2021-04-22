// /* eslint-disable */
import { Worker } from 'worker_threads'
import path from 'path'

const isDev = process.env.NODE_ENV === 'development'
const pathDev = path.join.apply(null, [process.cwd(), 'worker/cli.worker.js'])
const pathProd = path.join.apply(null, [
  process.resourcesPath,
  'worker/cli.worker.js'
])

const worker = new Worker(isDev ? pathDev : pathProd)
var mapping = new Map()
export default class Client {
  constructor () {
    worker.on('message', d => {
      const args = JSON.parse(d)
      mapping.get(args.id).resolve(args.data)
      mapping.delete(args.id)
    })
  }

  terminate = () =>
    new Promise(resolve => {
      worker.terminate(() => {
        resolve()
      })
    })

  postMessage = async (id, method, args = '') => {
    const promise = new Promise((resolve) => {
      mapping.set(id, {
        resolve: resolve,
        args: JSON.stringify({ id: id, method: method, args: args })
      })
    })
    worker.postMessage(JSON.stringify({ id: id, method: method, args: args }))
    return promise
  }
}
