const fs = require("fs");
const path = require("path");
const {createProxyMiddleware} = require("http-proxy-middleware");
const config = require("../../configs/config");
module.exports = {
    init: init
};

function createRoute(app) {
    let rawdata = fs.readFileSync(`${path.join(__dirname, '..', 'network', 'networkConfigs.json')}`);
    let json = JSON.parse(rawdata);
    console.log(json);
    for (var i = 0; i < json.length; i++) {
        app.use(`/custom${json[i].endpoint}`, createProxyMiddleware({
            target: `${json[i].secure ? "https" : "http"}://${json[i].targetHost}:${json[i].portNumber}`,
            changeOrigin: true,
            pathRewrite: {
                [`^/custom${json[i].endpoint}`]: json[i].endpoint,
            },
            secure: json[i].secure,
            logger: console
        }));
    }
}

function init(app) {
    app.get('/api/myruntimeroute', function (req, res) {
        res.send({"runtime": "route"});
    })
    createRoute(app);
}