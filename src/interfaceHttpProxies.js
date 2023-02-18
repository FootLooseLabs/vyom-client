const {createProxyMiddleware} = require('http-proxy-middleware');

const TERMINAL_SERVICE_URL = config.TERMINAL_SERVICE_URL;
const REQUEST_HANDLER_URL = config.REQUEST_HANDLER_URL

function proxyCli () {
    return createProxyMiddleware({
        target: TERMINAL_SERVICE_URL,
        changeOrigin: true,
        pathRewrite: {
            [`^/cli`]: '',
        },
        secure: true
    })
}


function proxyWsCredientialsRequest () {
    return createProxyMiddleware({
        target: REQUEST_HANDLER_URL,
        changeOrigin: true,
        pathRewrite: {
            [`^/request_credentials`]: '/generateToken',
        },
        secure: false,
        logger: console,
        onProxyReq(proxyReq, req, res) {
            if (req.method == 'POST') {
                if (req.body) delete req.body;

                // Make any needed POST parameter changes
                let body = new Object();

                body.email = `${config.TUNNEL_CLIENT_ID}@vyom.cc`;
                body.max_connections = '2';
                body.role = 'ALL';

                // URI encode JSON object
                body = Object.keys(body)
                    .map(function (key) {
                        return encodeURIComponent(key) + '=' + encodeURIComponent(body[key]);
                    })
                    .join('&');

                // Update header
                proxyReq.setHeader('content-type', 'application/x-www-form-urlencoded');
                proxyReq.setHeader('content-length', body.length);

                // Write out body changes to the proxyReq stream
                proxyReq.write(body);
                proxyReq.end();
            }
        },
    })
}


function proxyWs () {
    return createProxyMiddleware({
        target: `${config.REQUEST_HANDLER_URL}`,
        changeOrigin: true,
        secure: false,
        ws: true,
        logger: console,
        pathRewrite: {
            [`^/web_socket`]: '/wsapi',
        },
    })
}


module.exports = {
    proxyCli,
    proxyWsCredientialsRequest,
    proxyWs
}