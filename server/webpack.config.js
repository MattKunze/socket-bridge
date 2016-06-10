var path = require('path')
var webpack = require('webpack')
// var LiveReloadPlugin = require('webpack-livereload-plugin')

module.exports = {
  entry: [
    'webpack-hot-middleware/client',
    path.join(__dirname, 'app')
  ],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/static/'
  },
  plugins: [
    // new LiveReloadPlugin()
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin()
  ],
  module: {
    loaders: [{
      test: /\.js$/,
      loaders: [ 'babel' ],
      exclude: /node_modules/,
      include: __dirname
    }]
  }
}
