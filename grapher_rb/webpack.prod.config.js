const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');

module.exports = {
    mode: 'production',
    entry: './js/index.js',
    devtool: 'inline-source-map',
    output: {
        path: path.resolve(__dirname, 'lib'),
        filename: 'bundle.js'
    },
    optimization: {
        minimize: true
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
        new HtmlWebpackPlugin({
            inlineSource: '.(js|css)$'
        }),
        new HtmlWebpackInlineSourcePlugin()
    ]
};
