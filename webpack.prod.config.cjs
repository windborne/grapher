const path = require('path');
const WasmPackPlugin = require('@wasm-tool/wasm-pack-plugin');

module.exports = [
    {
        mode: 'production',
        entry: './src/index.js',
        devtool: 'source-map',
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: 'bundle.esm.js',
            library: {
                type: 'module'
            },
            publicPath: '/assets/'
        },
        experiments: {
            outputModule: true,
            asyncWebAssembly: true,
            syncWebAssembly: true
        },
        externals: {
            react: 'react',
            'react-dom': 'react-dom'
        },
        resolve: {
            extensions: ['.js', '.jsx', '.ts', '.tsx'],
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
    },
    // CJS build for backward compatibility
    {
        mode: 'production',
        entry: './src/index.js',
        devtool: 'source-map',
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: 'bundle.cjs',
            library: {
                name: 'Grapher',
                type: 'commonjs2'
            },
            publicPath: '/assets/'
        },
        externals: {
            react: 'react',
            'react-dom': 'react-dom'
        },
        experiments: {
            asyncWebAssembly: true,
            syncWebAssembly: true
        },
        resolve: {
            extensions: ['.js', '.jsx', '.ts', '.tsx'],
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
    }
];
