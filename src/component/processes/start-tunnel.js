const localtunnel = require('localtunnel');
import  config from "@config";

const TUNNEL_HOST = config.TUNNEL_HOST;

global.tunnelProcess = false;

function startTunnel(port, subdomain, host=TUNNEL_HOST, _timeout=5000) {

    console.debug("DBEUG: Create Tunnel Request for - ", subdomain, port, host);
    return new Promise(async (resolve, reject)=>{
        try{
            setTimeout(() => {
              return reject(Error(`ERROR: Tunnel Creation timed out after ${_timeout/1000}s.`))
            }, _timeout);

            tunnelProcess = await localtunnel({
                port: port,
                host: host,
                subdomain: subdomain.trim()
            });
        }catch(err){
            return reject(err);
        }

        tunnelProcess.on('error', err => {
            console.error("Error Occurred in creating tunnel ", err);
            component.emit("tunnel-error", err);
            return reject(err);
        });

        tunnelProcess.on('request', (info) => {
            console.log("Tunnel Request Received: ", info);
            component.emit("tunnel-request", info);
        })

        tunnelProcess.on('close', (ev) => {
            console.log("Tunnel Closed: ", ev);
            component.emit("tunnel-closed", ev);
        })

        /**
         * `cachedUrl` is set when using a proxy server that support resource caching.
         * This URL generally remains available after the tunnel itself has closed.
         * @see https://github.com/localtunnel/localtunnel/pull/319#discussion_r319846289
         */
        if (tunnelProcess.cachedUrl) {
            console.debug('DBEUG Tunnel Setup with cachedUrl : %s', tunnelProcess.cachedUrl);
        }

        console.debug('DBEUG: Tunnel Setup at : %s', tunnelProcess.url);

        component.emit("tunnel-created", tunnelProcess);

        return resolve(tunnelProcess);
    })
}


export {
	startTunnel
}