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
    path: __dirname + "/dist",
    filename: "bundle.js",
    clean: true,
  },
  builtins: {
    html: [
      {
        template: "./index.html",
        inject: true,
      },
    ],
  },
};
