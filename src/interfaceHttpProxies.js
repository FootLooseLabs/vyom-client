import config from "@config";

const {createProxyMiddleware} = require('http-proxy-middleware');

const TERMINAL_ENDPOINT = config.TERMINAL_ENDPOINT;
const WEBREQUEST_HANDLER_ENDPOINT = config.WEBREQUEST_HANDLER_ENDPOINT

function proxyCli () {
    console.debug("DBEUG: Proxying Cli - ", TERMINAL_ENDPOINT);
    return createProxyMiddleware({
        target: TERMINAL_ENDPOINT,
        changeOrigin: false,
        pathRewrite: {
            [`^/cli`]: '',
        },
        secure: false
    })
}

function proxyWsCredientialsRequest () {
    return createProxyMiddleware({
        target: WEBREQUEST_HANDLER_ENDPOINT,
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
        target: `${config.WEBREQUEST_HANDLER_ENDPOINT}`,
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