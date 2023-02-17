import "dotenv/config.js";
import config from "@config";

import NetworkManager from "@operators/network-manager";
import { logTelemetryPeriodically } from "@processes/sync-telemetry";
import { startTunnel } from "@processes/start-tunnel";

const Component = {};

Component.initLifecycle = function () {
    NetworkManager.applyConfig();

    component.on("tunnel-error", ()=>{
        component.deviceStatus = "offline";
    })

    component.on("tunnel-created", ()=>{
        component.deviceStatus = "online";
        logTelemetryPeriodically(config.SYNC_FREQUENCY);
    })


    component.on("tunnel-request", (_msg)=>{
        console.debug("-------DEBUG: Tunnel-Request-------- " , _msg);  
    })
}


Component.__start__ = async (cb) => {
    return new Promise(async (resolve, reject)=>{

        Component.initLifecycle();

        try{
            await startTunnel(config.LOCAL_PORT, config.TUNNEL_CLIENT_ID);
        }catch(e){
            throw e;
        }

        console.debug("DEBUG: @teleport/device-sdk initialized tunnel - ", tunnelProcess.url);

        if (cb) {
            try{
                cb();
            }catch(e){
                return reject(e);
            }
        }
        component.emit("has-started",{});
        return resolve(Component);
    })
}


module.exports = Component;