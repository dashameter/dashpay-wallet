module.exports = {
  transpileDependencies: true,
  configureWebpack: {
    resolve: {
      fallback: {
        zlib: false,
        http: false,
        https: false,
        os: false,
        path: false,
        fs: false,
        util: false,
        stream: false,
        assert: false,
        crypto: false,
        url: false,
      },
    },
  },
};
