import { join, resolve } from "path";
import { Configuration } from "webpack";
import TSPathConfig from "tsconfig-paths-webpack-plugin";

const { NODE_ENV } = process.env
const isDevMode = NODE_ENV != 'production'

module.exports = {
  entry: {
    'index': './index.ts'
  },
  output: {
    filename: '[name].js',
    path: join(__dirname, 'dist'),
    publicPath: '/dist/'
  },
  externals: {},
  resolve: { 
    extensions: ['.js', '.ts', '.tsx', '.json'],
    plugins: [
      new TSPathConfig({configFile: './tsconfig.json'})
    ]
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader'
      },
      {
        test: /\.obj$/,
        loader: resolve(__dirname, 'lib/OBJLoader.ts')
      },
      {
        test: /\.s(a|c)ss$/,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader'
        ]
      }
    ]
  },
  mode: isDevMode ? 'development' : 'production',
  watch: isDevMode, devtool: isDevMode ? 'source-map' : false
} as Configuration