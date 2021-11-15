import { DataServer } from './DataServer'
import { getPorts } from '../common/utils'

test('start and stop data server', async () => {
  const ports = await getPorts()
  const dataServer = new DataServer(ports.dataServer)
  // @ts-expect-error
  expect(dataServer.io.engine.opts.cors).toBe(false) // No cors should be set by default
  await dataServer.listen()
  await dataServer.close()
})
