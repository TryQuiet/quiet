import path from 'path'

export default {
    mode: 'development',
    entry: { 
        bundle: path.resolve(__dirname, 'src/index.ts') 
    },
    output: {
        path: path.resolve(__dirname, 'lib'),
        filename: '[name].js'
    },
    module: {
        rules: []
    },
    plugins: []
}