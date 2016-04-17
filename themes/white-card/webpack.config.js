var webpack = require('webpack');
var path = require('path');
var node_modules = path.resolve(__dirname, 'node_modules');

var jQuery = require('jquery');

//var LiveReloadPlugin = require('webpack-livereload-plugin');

var config = {
    entry: {
        index: './src/index.js',
        category: './src/category',
        article: './src/article'
    },
    output: {
        path: __dirname + '/static/js',
        publicPath: '/static/js/',
        contentBase: 'static/js/',
        filename: '[name].bundle.js'
    },
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                exclude: /(node_modules|bower_components)/,
                loader: 'babel' // 'babel-loader' is also a legal name to reference
            },
            {
                test: /\.css$/, // Only .css files
                loader: 'style!css' // Run both loaders
            },
            {
                test: /\.scss$/,
                loaders: ["style", "css", "sass"]
            },
            {
                test: /\.html$/, loader: "html"
            },
            {
                test: /\.txt$/, loader: "raw"
            },
            {
                test: /\.json$/, loader: "json"
            }
        ]
    },
    plugins: [
        //new LiveReloadPlugin()
    ]
};

module.exports = config;
