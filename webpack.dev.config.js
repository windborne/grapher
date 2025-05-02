const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WasmPackPlugin = require("@wasm-tool/wasm-pack-plugin");

const pages = require('./examples/page_list')
    .map((pageOrSection) => typeof pageOrSection === 'string' ? pageOrSection : pageOrSection.pages)
    .flat();

const entry = {
    'grapher': './src/grapher.js',
    // 'example_page': './examples/render_page.js',
};

for (let page of pages) {
    entry[page] = `./examples/${page}.js`;
}

module.exports = {
    mode: "development",
    entry,
    devtool: 'eval-source-map',
    output: {
        filename: '[name].bundle.js',
        publicPath: '/',
        path: path.resolve(__dirname, 'examples'),
        libraryTarget: 'umd'
    },
    optimization: {
        minimize: false,
        splitChunks: {
            chunks: "all",
            cacheGroups: {
                rust: {
                    priority: 10,
                    reuseExistingChunk: false,
                    enforce: true,
                    test: /rust/
                },
                vendors: {
                    test: /[\\/]node_modules[\\/]/,
                    priority: -10
                },
                default: {
                    minChunks: 2,
                    priority: -20,
                    reuseExistingChunk: true
                }
            }
        }
    },
    devServer: {
        static: {
            directory: path.resolve(__dirname, 'examples'),
        },
        compress: true,
        port: 9090,
        host: 'localhost',
        open: false,
        allowedHosts: 'all',
        client: {
            overlay: false
        },
        hot: true
    },
    experiments: {
        syncWebAssembly: true
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
    resolve: {
        fallback: {
            util: require.resolve("util/")
        }
    },
    plugins: [
        new WasmPackPlugin({
            crateDirectory: path.resolve(__dirname, 'src', 'rust'),
            outDir: path.resolve(__dirname, 'src', 'rust', 'pkg'),
            extraArgs: '--no-typescript --target web',
            forceMode: 'production'
        }),
        ...pages.map((page) => new HtmlWebpackPlugin({
            filename: `examples/${page}.html`,
            template: 'examples/index.html',
            chunks: ['grapher', page]
        }))
    ]
};
