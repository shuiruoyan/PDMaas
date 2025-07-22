process.env.PDMAAS_NODE_ENV = 'development';
var path = require('path');
var webpack = require('webpack');
var config = require('../config/webpack.dev.config.js');
var profile = require('../profile');
var host = profile.host;
var port = profile.port;
var protocol = profile.protocol;
var WebpackDevServer = require('webpack-dev-server');
const childProcess = require("child_process");

config.entry.app.unshift(`webpack-dev-server/client?${protocol}://${host}:${port}/`);

var compiler = webpack(config);


var devServer = new WebpackDevServer(compiler, {
    historyApiFallback: true,
    stats: { colors: true },
    headers: {
        'Access-Control-Allow-Origin': '*',
    },
    contentBase: path.resolve(__dirname, '../public'),
    proxy: {
        '/gwapi': {
            target: 'http://pdmaas.cn/gwapi/',
            changeOrigin: true,
            pathRewrite: {
                '^/gwapi': '',
            },
        },
    },
    after(){
        // 启动electron
        childProcess.spawn('npm', ['run', 'electron'], { shell: true, env: process.env, stdio: 'inherit' })
            .on('close', code => process.exit(code))
            .on('error', spawnError => console.error(spawnError));
    }
});

devServer.listen(port, host);
