var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var MiniCssExtractPlugin = require('mini-css-extract-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var ScriptExtHtmlPlugin = require('script-ext-html-webpack-plugin');
var OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
var webpack = require('webpack');
const {name, version} = require("../package.json");
const TerserPlugin = require("terser-webpack-plugin");

var platform = 'json';
if ([].concat(process.argv).splice(2, process.argv.length).includes('--web')) {
  platform = 'fetch';
}

var cpDir = [
  {
    from: path.resolve(__dirname, '../public'),
    to: path.resolve(__dirname, '../app/build')
  }
];

if (platform === 'json') {
  cpDir.push({
    from: path.resolve(__dirname, '../src/main.js'),
    to: path.resolve(__dirname, '../app/build')
  });
  const platformPtah = process.platform === 'win32' ? 'win' : 'linux'
  cpDir.push({
    from: path.resolve(__dirname, `../jre/${platformPtah}`),
    to: path.resolve(__dirname, '../app/build')
  });
}

module.exports = {
  mode: "production",
  entry: {
    app: [require.resolve('@babel/polyfill'),
      path.resolve(__dirname, '../src/lib/Math'),
      path.resolve(__dirname, '../src/index')]
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
            pure_funcs: ['console.log']
          }
        }
      })
    ],
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
    path: path.resolve(__dirname, '../app/build'),
    filename: "[name].[chunkhash:8].min.js",
    library: `${name}-[name]`,
    libraryTarget: 'umd', // 把微应用打包成 umd 库格式
    jsonpFunction: `webpackJsonp_${name}`,
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: true,
      template: path.resolve(__dirname, '../public/index.html'),
      filename: 'index.html',
      version: version,
      minify: {
        // 压缩html
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true
      }
    }),
    new ScriptExtHtmlPlugin({
      defaultAttribute: 'defer'
    }),
    new webpack.DefinePlugin({
      "BUILD_ENV": JSON.stringify({env: 'prd'}),
    }),
    new OptimizeCssAssetsPlugin({
      // 压缩css
      assetNameRegExp: /\.css$/g,
      cssProcessor: require('cssnano'),
      cssProcessorOptions: { discardComments: { removeAll: true } },
      canPrint: true
    }),
    new MiniCssExtractPlugin({
      filename: '[name].style.[hash].css',
    }),
    new CopyWebpackPlugin(cpDir, {
      // ignore: ["**/service/**"]
    })
  ],
  resolveLoader:{
    modules: ['node_modules']
  },
  resolve: {
    mainFields: ['browser', 'main'],
    alias: {
      'dataSource_utils': path.resolve(__dirname, '../pdmaas-desgin-util/pdmaasDesginUtil.min.js'),
      'components': path.resolve(__dirname, '../src/components'),
      'style': path.resolve(__dirname, '../src/style')
    }
  },
  module: {
    rules: [
      {
        test: /worker\.js$/,
        exclude: /node_modules/,
        use: { loader: 'worker-loader' }
      },
      {
        test: /\.(js|tsx|jsx)$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      },
      {
        test: /\.(css|less)$/,
        loader: [
          {
            loader: MiniCssExtractPlugin.loader
          },
          "css-loader",
          { loader: "postcss-loader", options: { plugins: () => [ require('autoprefixer')() ]}},
          { loader: 'less-loader', options: {
            additionalData: `@import 'style/variables.module.less';`
          }}]
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
