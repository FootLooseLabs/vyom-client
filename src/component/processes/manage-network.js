import NetworkManager from "@operators/network-manager";

global._DevicesTrackingProcess = false;

export async function addOrUpdateNetworkConfig (req, res) {
    console.debug("DBEUG: RECEIVED REQUEST TO ADD NETOWRK CONFIG", req.body)
    let newConfig = JSON.stringify(req.body);

    NetworkManager.updateConfig(newConfig);
    res.status(200).send();
}
