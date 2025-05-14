const path = require('path');
const WasmPackPlugin = require('@wasm-tool/wasm-pack-plugin');

module.exports = {
    mode: 'production',
    entry: './src/grapher.js',
    devtool: 'source-map',
    output: {
        path: path.resolve(__dirname), // string
        filename: 'bundle.js',
        publicPath: '/assets/',
        library: 'Grapher',
        libraryTarget: 'umd',
    },
    optimization: {
        minimize: true
    },
    externals: {
        react: 'react'
    },
    experiments: {
        asyncWebAssembly: true,
        syncWebAssembly: true
    },
    resolve: {
        fallback: {
            util: require.resolve("util/")
        }
    },
    module: {
        rules: [
            {
                test:/\.s?css$/,
                exclude: /(node_modules|bower_components|build)/,
                use:['style-loader', 'css-loader', 'sass-loader']
            },
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components|build)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ["@babel/preset-env", "@babel/preset-react"]
                    }
                }
            },
            {
                test: /\.(vert|frag|glsl)$/,
                use: 'webpack-glsl-loader'
            }
        ]
    },
    plugins: [
        new WasmPackPlugin({
            crateDirectory: path.resolve(__dirname, 'src', 'rust'),
            outDir: path.resolve(__dirname, 'src', 'rust', 'pkg'),
            extraArgs: '--no-typescript --target web',
            forceMode: 'production'
        })
    ]
};
