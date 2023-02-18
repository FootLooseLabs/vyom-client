import "dotenv/config.js";
import config from "@config";

import NetworkManager from "@operators/network-manager";
import { logTelemetryPeriodically } from "@processes/log-telemetry";
import { startTunnel } from "@processes/start-tunnel";

const Component = {};

Component.initLifecycle = function () {
    NetworkManager.applyConfig();

    component.on("tunnel-error", ()=>{
        component.deviceStatus = "offline";
        TUNNEL_SETUP_RETRY_COUNT+=1;
        setTimeout(() => {
           startTunnelProcess();
        }, TUNNEL_SETUP_RETRY_INTERVAL)
    })

    component.on("tunnel-closed", ()=>{
        component.deviceStatus = "offline";
        startTunnelProcess();
    })

    component.on("tunnel-created", ()=>{
        component.deviceStatus = "online";
        logTelemetryPeriodically(config.SYNC_FREQUENCY);
    })


    component.on("tunnel-request", (_msg)=>{
        console.debug("-------DEBUG: Tunnel-Request-------- " , _msg);  
        component.deviceStatus = "online";
    });
}


global.TUNNEL_SETUP_RETRY_INTERVAL=30000;
global.TUNNEL_SETUP_RETRY_COUNT = 0;
global.LAST_TUNNEL_SETUP_ATTEMPT_TS = 0;
async function startTunnelProcess(_retryInterval=TUNNEL_SETUP_RETRY_INTERVAL, _maxRetries, _resetRetryCounter) {
    if(Date.now() - LAST_TUNNEL_SETUP_ATTEMPT_TS < _retryInterval){
        return;
    }
    LAST_TUNNEL_SETUP_ATTEMPT_TS = Date.now();
    try{
        await startTunnel(config.LOCAL_PORT, config.TUNNEL_CLIENT_ID);
    }catch(e){
        throw e;
    }
}

Component.__start__ = async (cb) => {
    return new Promise(async (resolve, reject)=>{

        Component.initLifecycle();

        try{
            await startTunnelProcess();
        }catch(e){
            return reject(e);
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