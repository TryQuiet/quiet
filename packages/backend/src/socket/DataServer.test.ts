import { DataServer } from './DataServer'

import { expect, test } from '@jest/globals'
import { getPorts } from '../common/utils'

test('start and stop data server', async () => {
  const ports = await getPorts()
  const dataServer = new DataServer(ports.dataServer)
  expect(dataServer.io.engine.opts.cors).toBe({}) // No cors should be set by default
  await dataServer.listen()
  await dataServer.close()
})
