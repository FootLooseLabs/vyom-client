import "dotenv/config.js";
import config from "../configs/config";
import fetch from "node-fetch";
var cors = require('cors');
const kill = require("kill-port");
var express = require('express');
let app = express();
const {createProxyMiddleware} = require('http-proxy-middleware');
const localtunnel = require('localtunnel');
const si = require('systeminformation');

// Configuration
const PORT = 3000;
const HOST = "localhost";
const TERMINAL_SERVICE_URL = config.TERMINAL_SERVICE_URL;
let tunnel;
let refreshIntervalId;

app.use(cors({
    origin: ['https://teleport.vyom.cc', 'http://localhost:8005'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Set-Cookie', 'set-cookie']
}));

app.get('/', (req, res, next) => {
    res.send('This is a proxy service for connecting to RPI terminal remotely powered by VYOM.cc');
});

app.get('/health', (req, res, next) => {
    res.status(200).send("OK");
})

app.use('/cli', createProxyMiddleware({
    target: TERMINAL_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        [`^/cli`]: '',
    },
    secure: false
}));

app.use((err, req, res, next) => {
    console.error("ERROR: ", err.stack);
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    res.status(err.statusCode).json({
        status: err.status,
        message: err.message
    });
})

async function setupTunnel({port, clientId}) {
    console.log("Starting Tunnel...", port, clientId);
    try {
        tunnel = await localtunnel({port: port, subdomain: clientId.trim(), host: 'https://localtunnel.vyom.cc'});
    } catch (e) {
        console.error("Error:", e);
        throw e;
    }

    // the assigned public url for your tunnel
    // i.e. https://abcdefgjhij.localtunnel.vyom.cc
    console.log(`Tunnel URL: ${tunnel.url}`);
    await syncSystemInformationToServer({tunnelUrl: tunnel.url, deviceStatus: 'online'});
    tunnel.on('close', () => {
        // tunnels are closed
        console.error("Tunnel closed unexpectedly");
        clearInterval(refreshIntervalId);
        syncSystemInformationToServer({deviceStatus: 'offline'});
    });
    tunnel.on('error', (err) => {
        // handle errors
        console.error("Error Occurred in creating tunnel ", err);
        clearInterval(refreshIntervalId);
        syncSystemInformationToServer({deviceStatus: 'offline'});
    });
    tunnel.on('request', (info) => {
        if(info.path !== '/cli/'){
            console.log("Tunnel Request Received: ", info);
        }
    })
}

async function getSystemInformation() {
    //console.log(currentSystemInfo);
    return await si.getAllData('*', '*');
}

async function syncSystemInformationToServer(additionalInfo) {
    console.log("Syncing System Information to Server...", additionalInfo);
    var data = {...await getSystemInformation(), ...additionalInfo};
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
        console.log(`${new Date()} INFO: syncSystemInformationToServer API response status`, response.status)
        return response;
    } catch (e) {
        throw e;
    }
}

app.__start__ = async (cb) => {
    try {
        kill(PORT).then(() => {
            app.listen(PORT, HOST, async () => {
                console.log(`Starting Proxy at ${HOST}:${PORT}`);
                await setupTunnel({port: PORT, clientId: `${config.TUNNEL_CLIENT_ID}`});
                refreshIntervalId = setInterval(async () => {
                    await syncSystemInformationToServer();
                }, 60000);
            });
        });
    } catch (e) {
        console.error("Error:", e);
    }
}

module.exports = app;
