import "dotenv/config.js";
import config from "../configs/config";
import fetch from "node-fetch";

const path = require('path');
const actuator = require('express-actuator');
var cors = require('cors');
const kill = require("kill-port");
var express = require('express');
let app = express();
var bodyParser = require('body-parser');
const {createProxyMiddleware} = require('http-proxy-middleware');
const localtunnel = require('localtunnel');
const si = require('systeminformation');
const fs = require('fs');

// Configuration
const PORT = 3000;
const HOST = "localhost";

const TUNNEL_HOST = config.TUNNEL_HOST;
const TERMINAL_SERVICE_URL = config.TERMINAL_SERVICE_URL;
const REQUEST_HANDLER_URL = config.REQUEST_HANDLER_URL
let tunnel;
let refreshIntervalId;
//app.use(bodyParser.urlencoded({extended: true})); # NOTE: Not to use this as it will break the CLI requests
app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use(cors({
    origin: ['https://teleport.vyom.cc', 'http://localhost:8005'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Set-Cookie', 'set-cookie']
}));
app.use(actuator({infoBuildOptions: {clientId: config.TUNNEL_CLIENT_ID}}));

app.get('/', (req, res, next) => {
    res.send('This is a proxy service for connecting to RPI terminal remotely powered by VYOM.cc');
});

app.use('/cli', createProxyMiddleware({
    target: TERMINAL_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        [`^/cli`]: '',
    },
    secure: false
}));

app.use('/request_credentials', createProxyMiddleware({
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
}));

const wsProxy = createProxyMiddleware({
    target: `${config.REQUEST_HANDLER_URL}`,
    changeOrigin: true,
    secure: false,
    ws: true,
    logger: console,
    pathRewrite: {
        [`^/web_socket`]: '/wsapi',
    },
})

app.use('/web_socket/:client_id', wsProxy)

app.use((err, req, res, next) => {
    console.error("ERROR: ", err.stack);
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    res.status(err.statusCode).json({
        status: err.status,
        message: err.message
    });
})

app.post('/api/network_config', function (req, res) {
    console.log("RECEIVED REQUEST TO ADD NETOWRK CONFIG", req.body)
    var networkConfigs = req.body;
    let config = JSON.stringify(networkConfigs);
    fs.writeFileSync(`${path.join(__dirname, '/network', '/networkConfigs.json')}`, config);
    var dynamicController = require('./controllers/RuntimeController');
    dynamicController.init(app);
    res.status(200).send();
});

function createTunnel(port, subdomain, host=TUNNEL_HOST, _timeout=5000) {

    console.debug("DBEUG: Create Tunnel Request for - ", subdomain, port, host);
    return new Promise(async (resolve, reject)=>{
        try{
            setTimeout(() => {
              return reject(Error(`ERROR: Tunnel Creation timed out after %{_timeout/1000}s.`))
            }, _timeout);

            var tunnel = await localtunnel({
                port: port,
                host: host,
                subdomain: subdomain.trim()
            });
        }catch(err){
            return reject(err);
        }

        tunnel.on('error', err => {
            console.error("Error Occurred in creating tunnel ", err);
            syncSystemInfoWithHost({deviceStatus: 'offline'});
            return reject(err);
        });

        tunnel.on('request', (info) => {
            console.log("Tunnel Request Received: ", info);
        })

        /**
         * `cachedUrl` is set when using a proxy server that support resource caching.
         * This URL generally remains available after the tunnel itself has closed.
         * @see https://github.com/localtunnel/localtunnel/pull/319#discussion_r319846289
         */
        if (tunnel.cachedUrl) {
            console.debug('DBEUG Tunnel Setup with cachedUrl : %s', tunnel.cachedUrl);
        }

        console.debug('DBEUG: Tunnel Setup at : %s', tunnel.url);

        return resolve(tunnel);
    })
}

// async function setupTunnel({port, clientId}) {
//     console.log("Starting Tunnel...", port, clientId);
//     try {
//         tunnel = await localtunnel({port: port, subdomain: clientId.trim(), host: 'https://localtunnel.vyom.cc'});
//     } catch (e) {
//         console.error("Error:", e);
//         throw e;
//     }

//     // the assigned public url for your tunnel
//     // i.e. https://abcdefgjhij.localtunnel.vyom.cc
//     console.log(`Tunnel URL: ${tunnel.url}`);
//     await syncSystemInfoWithHost({tunnelUrl: tunnel.url, deviceStatus: 'online'});
//     tunnel.on('close', () => {
//         // tunnels are closed
//         console.error("Tunnel closed unexpectedly");
//         clearInterval(refreshIntervalId);
//         syncSystemInfoWithHost({deviceStatus: 'offline'});
//     });
//     tunnel.on('error', (err) => {
//         // handle errors
//         console.error("Error Occurred in creating tunnel ", err);
//         clearInterval(refreshIntervalId);
//         syncSystemInfoWithHost({deviceStatus: 'offline'});
//     });
//     tunnel.on('request', (info) => {
//         if (info.path !== '/cli/') {
//             console.log("Tunnel Request Received: ", info);
//         }
//     })
// }

async function getSystemInformation() {
    //console.log(currentSystemInfo);
    return await si.getAllData('*', '*');
}


async function pingSystemInfoToHost(_info) {
    console.log("Syncing System Information to Server...", _info);
    var data = {...await getSystemInformation(), ..._info};
    try {
        const response = await fetch(config.PLATFORM_BACKEND_URL + `api/client/${config.TUNNEL_CLIENT_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': "application/json",
                'x-real-host': 'teleport.vyom.cc'
            },
            body: JSON.stringify(data),
            redirect: 'follow'
        })
        console.log(`${new Date()} INFO: pingSystemInfoToHost API response status`, response.status)
        return response;
    } catch (e) {
        throw e;
    }
}

async function syncSystemInfoWithHost(_info, _frequency=config.SYNC_FREQUENCY) {

    console.debug("DEBUG: Starting Device Info Sync at frequency = ", _frequency, ". Info = ", _info);

    if(_info.deviceStatus == "offline"){
        return clearInterval(refreshIntervalId);
    }
    if(refreshIntervalId){
        console.debug("DEBUG: syncSystemInfoWithHost Request Received but it is already running");
        return;
    }

    refreshIntervalId = setInterval(async () => {
        try {
            await pingSystemInfoToHost(_info);
        } catch (e) {
            console.log(e);
        }
    }, _frequency);   
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

app.__start__ = async (cb) => {
    try {
        kill(PORT).then(async () => {
            const server = await app.listen(PORT, HOST);

            console.log(`Started Proxy at ${HOST}:${PORT}`);
            // await sleep(5000)

            try{
                var tunnel = await createTunnel(PORT, `${config.TUNNEL_CLIENT_ID}`);
            }catch(e){
                throw e;
            }

            console.debug("DEBUG: Created Tunnel - ", tunnel);

            syncSystemInfoWithHost({clientId: tunnel.clientId, tunnelUrl: tunnel.url, deviceStatus: 'online'})
            
            var dynamicController = require('./controllers/RuntimeController');
            dynamicController.init(app);

            server.on('upgrade', wsProxy.upgrade);
        });
    } catch (e) {
        console.error("Error:", e);
    }
}

module.exports = app;
