const path = require('path');

module.exports = {
  context: __dirname,
  entry: "./script/main.js",
  devServer: {
    port: 1113,
    open: true,
    hot: true,
    static: {
      directory: "./",
    },
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
    clean: true,
    publicPath: "/",
  },
  builtins: {
    html: [
      {
        template: "./index.html",
        inject: true,
      },
    ],
    copy: {
      patterns: [
        "fonts/**/*",
        "img/**/*",
        "music/**/*",
        "style/**/*",
        "wishes.json",
      ],
    },
  },
};
