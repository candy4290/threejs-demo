const { createProxyMiddleware } = require('http-proxy-middleware');
module.exports = function(app) {
    app.use(
        createProxyMiddleware("/cxx", {
            target: "http://172.20.62.119:30555",
            changeOrigin: true,
            logLevel: 'debug',
            pathRewrite: {
                "^/cxx": ""
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