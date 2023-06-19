import path from 'path'
import { fileURLToPath } from 'url';
import webpack from 'webpack'
import webpackNodeExternals from 'webpack-node-externals';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function root(args) {
    args = Array.prototype.slice.call(arguments, 0);
    return path.join.apply(path, [__dirname].concat(args));
}

const webpackConfig = (env) => {
    const config = {
        mode: env.mode,
        target: 'node',
        entry: {
            bundle: path.resolve(__dirname, 'src', 'backendManager.ts')
        },
        output: {
            path: path.resolve(__dirname, 'lib'),
            filename: '[name].cjs'
        },
        // We don't use minimization because we lose access to meaningful logs in production.
        optimization: {
            minimize: false
        },
        resolve: {
            extensions: ['.ts', '.js']
        },
        externals: [webpackNodeExternals()],
        module: {
            rules: [
                {
                    test: /\.ts?$/,
                    use: {
                        loader: 'ts-loader',
                        options: {
                            configFile: 'tsconfig.build.json'
                        }
                    },
                    exclude: [/node_modules/, /packages[\/\\]identity/, /packages[\/\\]state-manager/, /packages[\/\\]logger/],
                    
                },
                {
                    test: /node_modules[\/\\]@achingbrain[\/\\]ssdp[\/\\]dist[\/\\]src[\/\\]default-ssdp-options.js/,
                    loader: 'string-replace-loader',
                    options: {
                        search: "const pkg = req('../../package.json')",
                        replace: "import pkg from '../../package.json'"
                    }
                },
                {
                    test: /node_modules[\/\\]classic-level[\/\\]index.js/,
                    loader: 'string-replace-loader',
                    options: {
                        search: "const binding = require('./binding')",
                        replace: "const binding = require('./binding').default"
                    }
                },
                {
                    test: /node_modules[\/\\]classic-level[\/\\]iterator.js/,
                    loader: 'string-replace-loader',
                    options: {
                        search: "const binding = require('./binding')",
                        replace: "const binding = require('./binding').default"
                    }
                }
            ]
        },
        plugins: [
            new webpack.NormalModuleReplacementPlugin(
                /node_modules[\/\\]classic-level[\/\\]binding.js/,
                root('classic_level.cjs')
            ),
            new webpack.NormalModuleReplacementPlugin(
                /node_modules[\/\\]ipfs-utils[\/\\]src[\/\\]http[\/\\]fetch.js/,
                'fetch.node.js'
            ),
            new webpack.NormalModuleReplacementPlugin(
                /node_modules[\/\\]ipfs-utils[\/\\]src[\/\\]fetch.js/,
                root(path.join('node_modules', 'electron-fetch', 'lib', 'index.js'))
            )
        ],
        experiments: {
            topLevelAwait: true
        }
    }
    return config
}
export default webpackConfig
