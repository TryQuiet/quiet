import path from 'path'
import { fileURLToPath } from 'url';
import webpack from 'webpack'
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function root(args) {
    args = Array.prototype.slice.call(arguments, 0);
    return path.join.apply(path, [__dirname].concat(args));
}

export default {
    mode: 'development',
    target: 'node',
    entry: {
        bundle: path.resolve(__dirname, 'src/backendManager.ts')
    },
    output: {
        path: path.resolve(__dirname, 'lib'),
        filename: '[name].js'
    },
    resolve: {
        extensions: ['.ts', '.js'],
        alias: {
            // ['classic-level']: path.resolve(__dirname, './classic_level.js'),
            // ['leveldown']: path.resolve(__dirname, './leveldown.js'),
        }
    },
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: [
                    'ts-loader'
                ],
                exclude: [/node_modules/, /packages[\/\\]identity/, /packages[\/\\]state-manager/, /packages[\/\\]logger/]
            }
        ]
    },
    plugins: [
        new webpack.NormalModuleReplacementPlugin(
            /node_modules\/classic-level\/binding.js/,
            root('classic_level.js')
        ),
        new webpack.NormalModuleReplacementPlugin(
            /node_modules\/ipfs-utils\/src\/http\/fetch.js/,
            'fetch.node.js'
        ),
        new webpack.NormalModuleReplacementPlugin(
            /node_modules\/ipfs-utils\/src\/fetch.js/,
            root('node_modules/electron-fetch/lib/index.js')
        )
    ]
}