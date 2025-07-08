const path = require('path');
const WasmPackPlugin = require('@wasm-tool/wasm-pack-plugin');
const nodeExternals = require('webpack-node-externals');
const isCoverage = process.env.NODE_ENV === 'coverage';

module.exports = {
    target: 'node',
    mode: 'development',
    devtool: 'inline-cheap-module-source-map',
    externals: [nodeExternals()],
    output: {
        devtoolModuleFilenameTemplate: '[absolute-resource-path]',
        devtoolFallbackModuleFilenameTemplate: '[absolute-resource-path]?[hash]'
    },
    experiments: {
        syncWebAssembly: true
    },
    resolve: {
        fallback: {
            util: require.resolve("util/")
        }
    },
    module: {
        rules: [
            isCoverage ? {
                test: /\.(js|ts)/,
                include: path.resolve('src'),
                loader: 'istanbul-instrumenter-loader'
            } : [],
            {
                test:/\.s?css$/,
                exclude: /(node_modules|bower_components|build)/,
                use:['style-loader', 'css-loader', 'sass-loader']
            },
            {
                test: /\.jsx?$/,
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
        ].flat()
    },
    plugins: [
        new WasmPackPlugin({
            crateDirectory: path.resolve(__dirname, 'src', 'rust'),
            outDir: path.resolve(__dirname, 'src', 'rust', 'pkg'),
            extraArgs: '--no-typescript',
            forceMode: 'production'
        })
    ]
};
