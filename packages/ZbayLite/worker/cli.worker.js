const { parentPort } = require('worker_threads')
const Client = require('./RPC')
const client = new Client()
parentPort.on('message', async data => {
  try {
    const request = JSON.parse(data)
    const method = client[request.method]
    const tx = await method(request.args)
    parentPort.postMessage(JSON.stringify({ id: request.id, data: tx }))
  } catch (error) {
    console.log(error)
  }
})
