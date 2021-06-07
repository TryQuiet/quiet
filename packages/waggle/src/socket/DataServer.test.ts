import { DataServer } from './DataServer'
import { getPorts } from '../utils'

test('start and stop data server', async () => {
  const ports = await getPorts()
  const dataServer = new DataServer(ports.dataServer)
  await dataServer.listen()
  await dataServer.close()
})
