const fs = require("fs");
const path = require("path");

const NETWORK_CONFIG_JSON_PATH = `${path.join(__dirname, '..', 'models', 'networkConfigs.json')}`;

const OPERATOR = {

    updateConfig: function(newConfig, configPath=NETWORK_CONFIG_JSON_PATH, applyAfterUpdate=true) {
        try{
            fs.writeFileSync(configPath, newConfig);
        }catch(e){
            throw e;
        }

        if(applyAfterUpdate){
            this.applyConfig();
        }
    },
    applyConfig() {
        console.debug("DEBUG: Applying Network Config at - ", new Date());
        component.emit("network-config-updated", {
            routes: this._getRoutesFromNetworkConfig()
        });
    },
    _getRoutesFromNetworkConfig: function(_networkConfigJsonFilePath=NETWORK_CONFIG_JSON_PATH) {
        let rawdata = fs.readFileSync(_networkConfigJsonFilePath);
        let json = JSON.parse(rawdata);
        console.debug("DEBUG: getRoutesFromNetworkConfig received json = ", json);

        var httpRoutes = [];

        for (var i = 0; i < json.length; i++) {
            let endpoint = `/custom${json[i].endpoint}`;
            let config = {
                target: `${json[i].secure ? "https" : "http"}://${json[i].targetHost}:${json[i].portNumber}`,
                changeOrigin: true,
                pathRewrite: {
                    [`^/custom${json[i].endpoint}`]: json[i].isWebsocket ? `${json[i].wsPath}` : `${json[i].endpoint}`,
                },
                secure: json[i].secure,
                ws: json[i].isWebsocket,
                logger: console
            }
            httpRoutes.push({
                endpoint: endpoint,
                config: config
            });
        }

        return httpRoutes
    }
}

export default OPERATOR;