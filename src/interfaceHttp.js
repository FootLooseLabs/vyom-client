const actuator = require('express-actuator');
var cors = require('cors');
const kill = require("kill-port");
var express = require('express');
let app = express();
var bodyParser = require('body-parser');


const {proxyCli, proxyWsCredientialsRequest, proxyWs} = require('./interfaceHttpProxies');
const apiRoutes = require('./interfaceHttpRoutes');

import config from "@config";

// Configuration
const PORT = 3000;
const HOST = "localhost";

//app.use(bodyParser.urlencoded({extended: true})); # NOTE: Not to use this as it will break the CLI requests
app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use(cors({
    origin: ['https://teleport.vyom.cc', 'http://localhost:8005'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Set-Cookie', 'set-cookie']
}));

app.use((err, req, res, next) => {
    console.error("ERROR: ", err.stack);
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    res.status(err.statusCode).json({
        status: err.status,
        message: err.message
    });
});

app.use(actuator({infoBuildOptions: {clientId: config.TUNNEL_CLIENT_ID}}));

app.addNewRoute = ({endpoint, config}) => {
    app.use(endpoint, createProxyMiddleware(config))
}

app.addNewRoutes = (_routeList) => {
    _routeList.forEach((_route) => {
        app.addNewRoute(_route);
    });
}

app.get('/', (req, res, next) => {
    res.send('<@Teleport/device-sdk:::HttpInterface>');
});

app.use('/cli', proxyCli);

app.use('/request_credentials', proxyWsCredientialsRequest);

app.use('/web_socket/:client_id', proxyWs);

app.use('/api', apiRoutes);

app.start = async (cb) => {
    try {
        // this will attempt to kill any existing procrss using the port ${POST} 
        // however if the other process is managed so as to respawn after sigterm, it might create a conflict.
        await kill(PORT);
    } catch (e) {
        throw e;
    }

    try{
        var server = await app.listen(PORT, HOST);
    }catch(e){
        throw e;
    }

    console.log(`DEBUG: @Teleport/device-sdk:::HttpInterface Listening at ${HOST}:${PORT}`);

    server.on('upgrade', proxyWs);
}

module.exports = app;
