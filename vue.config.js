module.exports = {
  configureWebpack: {
    resolve: {
      alias: {
        zlib: require.resolve('browserify-zlib'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        os: require.resolve('os-browserify/browser'),
        path: require.resolve('path-browserify'),
        fs: false,
        util: require.resolve('util'),
        stream: require.resolve('stream-browserify'),
        assert: require.resolve('assert'),
        crypto: require.resolve('crypto-browserify'),
        url: require.resolve('url'),
      },
    },
  },
};
