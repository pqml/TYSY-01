const path = require('path')
const isProduction = (process.env.NODE_ENV === 'production')

module.exports = {
  // Used by the devServer and base href
  public: isProduction ? '/jupik/' : '/',

  // Used by the module bundler
  root: path.join(__dirname, '..'),
  src: path.join(__dirname, '..', 'src'),
  build: path.join(__dirname, '..', 'build'),
  static: path.join(__dirname, '..', 'static'),

  // Node-Resolve aliases
  components: path.join(__dirname, '..', 'src', 'components'),
  utils: path.join(__dirname, '..', 'src', 'utils'),
  letters: path.join(__dirname, '..', 'src', 'letters'),
  core: path.join(__dirname, '..', 'src', 'core'),
  config: path.join(__dirname, '..', 'src', 'config'),
  drawings: path.join(__dirname, '..', 'src', 'drawings'),

  // Generating page from content and layouts
  layouts: path.join(__dirname, '..', 'src', 'layouts'),
  partials: path.join(__dirname, '..', 'src', 'layouts')
}
