import path from 'path'
import { fileURLToPath } from 'url';
import NodePolyfillPlugin from "node-polyfill-webpack-plugin"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    mode: 'development',
    entry: {
        bundle: path.resolve(__dirname, 'src/index.ts')
    },
    output: {
        path: path.resolve(__dirname, 'lib'),
        filename: '[name].js'
    },
    resolve: {
        extensions: ['.ts', '.js'],
        fallback: {
            "fs": false,
            "net": false,
            "child_process": false,
            "async_hooks": false,
            "tls": false
          } 
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [
                    'ts-loader'
                ],
                exclude: [/node_modules/, /packages[\/\\]identity/, /packages[\/\\]state-manager/, /packages[\/\\]logger/]
            }
        ]
    },
    plugins: [
        new NodePolyfillPlugin()
    ]
}