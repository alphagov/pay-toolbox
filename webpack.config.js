// @ts-check
/** @typedef { import('webpack').Configuration } WebpackConfig */

const ManifestPlugin = require('webpack-manifest-plugin')

/** @type WebpackConfig */
const browser = {
  entry: {
    browser: './browser/src/main.tsx'
  },
  output: {
    path: `${__dirname}/dist/public`,
    filename: '[name].[contenthash].js'
  },
  resolve: {
    extensions: [ '.ts', '.tsx', '.js', '.jsx' ]
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          onlyCompileBundledFiles: true
        }
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: [ 'url-loader' ]
      }
    ]
  },

  // allow react to be served separately, allowing page bundles to stay small
  externals: {
    // react: 'React',
    // 'react-dom': 'ReactDOM'
  },
  plugins: [
    new ManifestPlugin({
      fileName: 'browser.manifest.json'
    })
  ]
}

const configs = [ browser ]

module.exports = configs
