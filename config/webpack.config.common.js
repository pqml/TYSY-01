const path = require('path')
const paths = require('./paths.config')

module.exports = {
  entry: [
    path.join(paths.src, 'app.js'),
    path.join(paths.src, 'app.styl')
  ],
  output: {
    publicPath: paths.public,
    filename: '[hash].js',
    chunkFilename: '[hash].[id].chunk.js'
  },
  resolve: {
    alias: {
      components: paths.components,
      utils: paths.utils,
      letters: paths.letters,
      core: paths.core,
      config: paths.config,
      glyphs: paths.glyphs
    },
    modules: [
      paths.src,
      'node_modules'
    ],
    mainFields: ['main', 'browser']
  },
  module: {
    rules: [
      {
        test: /\.(js)$/,
        loader: 'babel-loader',
        include: paths.src
      }
    ]
  },
  plugins: []
}
