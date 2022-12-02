import { CryptoService } from './service'

test('start and stop data server', async () => {
  const cryptoService = new CryptoService(1000)
  // @ts-expect-error
  expect(cryptoService.io.engine.opts.cors).toBe(false) // No cors should be set by default
  await cryptoService.listen()
  await cryptoService.close()
})
