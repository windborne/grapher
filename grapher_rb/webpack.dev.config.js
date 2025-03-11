const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: "development",
    entry: './js/index.js',
    devtool: 'inline-source-map',
    optimization: {
        minimize: false,
        splitChunks: {
            cacheGroups: {
                grapher: {
                    name: "grapher",
                    chunks: "all"
                }
            }
        }
    },
    devServer: {
        contentBase: path.resolve(__dirname),
        compress: true,
        port: 9000,
        host: 'localhost',
        open: false,
        disableHostCheck: true
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
            }
        ]
    },

    plugins: [
        new HtmlWebpackPlugin()
    ]
};
