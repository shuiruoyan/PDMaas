var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var MiniCssExtractPlugin = require('mini-css-extract-plugin');
var ScriptExtHtmlPlugin = require('script-ext-html-webpack-plugin');
var webpack = require('webpack');
const { name } = require('../package.json');

var platform = 'json';
if ([].concat(process.argv).splice(2, process.argv.length).includes('--web')) {
  platform = 'fetch';
}

module.exports = {
  mode: 'development',
  devtool: 'cheap-module-eval-source-map',
  entry: {
    app: [require.resolve('@babel/polyfill'),
      path.resolve(__dirname, '../src/lib/Math'),
      path.resolve(__dirname, '../src/index')]
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        common: {
          name: "common",
          chunks: "all",
          minSize: 1,
          priority: 0
        },
        vendor: {
          name: "vendor",
          test: /[\\/]node_modules[\\/]/,
          chunks: "all",
          priority: 10
        }
      }
    }
  },
  output: {
    path: path.resolve(__dirname, '../build'),
    filename: "[name].js",
    library: `${name}-[name]`,
    libraryTarget: 'umd', // 把微应用打包成 umd 库格式
    jsonpFunction: `webpackJsonp_${name}`,
  },
  plugins: [
    new HtmlWebpackPlugin({
      hash: true,
      inject: true,
      template: path.resolve(__dirname, '../public/index.html'),
      filename: 'index.html',
      chunks: ['vendor', 'common', 'app']
    }),
    new webpack.DefinePlugin({
      "BUILD_ENV": JSON.stringify({env: 'dev'}),
    }),
    new ScriptExtHtmlPlugin({
      defaultAttribute: 'defer'
    }),
    new MiniCssExtractPlugin({
      filename: '[name].style.css',
    })
  ],
  resolveLoader:{
    modules: ['node_modules']
  },
  resolve: {
    mainFields: ['browser', 'main'],
    alias: {
      'components': path.resolve(__dirname, '../src/components'),
      'dataSource_utils': path.resolve(__dirname, '../pdmaas-desgin-util/pdmaasDesginUtil.min.js'),
      'style': path.resolve(__dirname, '../src/style')
    }
  },
  module: {
    rules: [
      {
        test: /worker\.js$/,
        exclude: /node_modules/,
        use: [
          { loader: 'worker-loader' }
        ]
      },
      {
        test: /\.(js|tsx|jsx)$/,
        exclude: /node_modules|pdmaas-desgin-util/,
        loader: 'babel-loader'
      },
      {
        test: /\.(js|tsx|jsx)$/,
        exclude: /node_modules|pdmaas-desgin-util/,
        loader: "eslint-loader"
      },
      {
        test: /\.(css|less)$/,
        loader: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          "css-loader",
          { loader: "postcss-loader", options: { plugins: () => [ require('autoprefixer')() ]}},
          { loader: 'less-loader',
            options: {
              additionalData: `@import 'style/variables.module.less';`
          }}
        ]
      },
      {
        test: /\.(png|jpg|svg|gif|woff2|eot|ttf|woff)$/,
        loader: 'url-loader',
        options: {
          limit: 1019200
        }
      }
    ]
  },
  target: 'electron-renderer'
}
