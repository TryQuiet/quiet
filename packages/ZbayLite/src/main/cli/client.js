import { Worker } from 'worker_threads'
const worker = new Worker('./src/main/cli/worker.js')

var mapping = new Map()
export default class Client {
  constructor () {
    worker.on('message', d => {
      const args = JSON.parse(d)
      mapping.get(args.id).resolve(args.data)
      mapping.delete(args.id)
    })
  }
  postMessage = async (id, method, args = '') => {
    const promise = new Promise((resolve, reject) => {
      mapping.set(id, {
        resolve: resolve,
        args: JSON.stringify({ id: id, method: method, args: args })
      })
    })
    worker.postMessage(
      JSON.stringify({ id: id, method: method, args: args })
    )
    return promise
  }
}
