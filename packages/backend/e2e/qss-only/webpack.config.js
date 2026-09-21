import path from 'node:path'
import { fileURLToPath } from 'node:url'
import webpack from 'webpack'
import baseConfig from '../../webpack.config.js'
import mode from './mode.cjs'

const fixtures = path.dirname(fileURLToPath(import.meta.url))

export default env => {
  if (!env.qssOnlyOutput || !path.isAbsolute(env.qssOnlyOutput)) throw new Error('Provide an absolute QSS-only output directory')
  const config = baseConfig({ ...env, mode: 'development' })
  config.output = { ...config.output, path: env.qssOnlyOutput }
  config.plugins.push(
    new webpack.NormalModuleReplacementPlugin(/(?:^|[/\\])tor\.module(?:\.ts)?$/, resource => {
      resource.request = path.join(fixtures, 'tor.module.cjs')
    }),
    new webpack.NormalModuleReplacementPlugin(/(?:^|[/\\])tor\.service(?:\.ts)?$/, resource => {
      resource.request = path.join(fixtures, 'tor.service.cjs')
    }),
    new webpack.NormalModuleReplacementPlugin(/^libp2p$/, resource => {
      // The fixture itself imports the real factory, then removes transports.
      if (resource.context !== fixtures) resource.request = path.join(fixtures, 'libp2p.js')
    }),
    new webpack.BannerPlugin({
      raw: true,
      banner: `/* ${mode.MARKER}: Tor metadata simulated; P2P disabled. */\n(function () { const ENDPOINT = ${JSON.stringify(mode.ENDPOINT)}; (${mode.requireQssOnlyEnvironment.toString()})(process.env); })();`,
    })
  )
  return config
}
