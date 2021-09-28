const { createProxyMiddleware } = require('http-proxy-middleware');
module.exports = function(app) {
    app.use(
        createProxyMiddleware("/jiadingqinwu-api", {
            target: "http://172.20.62.117:47070",
            changeOrigin: true,
            logLevel: 'debug',
            pathRewrite: {
                "^/jiadingqinwu-api": ""
            }
        }),
    );
    app.use(
        createProxyMiddleware("/prod-api", {
            target: "http://172.20.62.117:48080",
            changeOrigin: true,
            logLevel: 'debug',
            pathRewrite: {
                "^/prod-api": ""
            }
        }),
    )
}