import { DataServer } from './DataServer'

import { expect, test } from '@jest/globals'
import { getPorts }  from'../common/utils'

test.skip('start and stop data server', async () => {
  const ports = await getPorts()
  const dataServer = new DataServer(ports.dataServer)
  // TODO:JEST
  // expect(dataServer.io.engine.opts.cors).toBe(false) // No cors should be set by default
  await dataServer.listen()
  await dataServer.close()
})
