import fetch from "node-fetch";
import  config from "@config";
import SystemManager from "@operators/system-manager";

async function logInfoWithHost(_info) {
    console.debug("DEBUG: Syncing Information with Host at ", new Date());
    try {
        const response = await fetch(config.PLATFORM_BACKEND_URL + `api/client/${config.TUNNEL_CLIENT_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': "application/json",
                'x-real-host': 'teleport.vyom.cc'
            },
            body: JSON.stringify(_info),
            redirect: 'follow'
        })
        console.log(`${new Date()} INFO: logInfoWithHost API response status`, response.status)
        return response;
    } catch (e) {
        throw e;
    }
}


global.telemetryLogProcess = false;

async function logTelemetryPeriodically(_frequency=config.SYNC_FREQUENCY) {

    if(telemetryLogProcess){
        clearTimeout(telemetryLogProcess);
    }
    
    telemetryLogProcess = setTimeout(async () => {
        logTelemetryPeriodically.call(this, _frequency)
    }, _frequency);

    let deviceTunnelStatus = component.deviceStatus ? component.deviceStatus : "online";
    var _info = {
        ...await SystemManager.getSystemInfo(), 
        ...{
            clientId: tunnelProcess.clientId, 
            tunnelUrl: tunnelProcess.url, 
            deviceStatus: deviceTunnelStatus
        }
    };


    console.debug("DEBUG: Device Info Syncing at frequency = ", _frequency, "s. at time = ", new Date(), ", device-tunnel-status = ", deviceTunnelStatus);

    try {
        await logInfoWithHost(_info);
    } catch (e) {
        console.log(e);
    }   
}

export {
    logTelemetryPeriodically,
    logInfoWithHost
}