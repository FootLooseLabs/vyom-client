var Atom = require('atom');
const lexicon = require("./lexicon/requests");

global.component = require('./component/main');

const eventHandlers = require("./interfaceEvents");

const interfaceHttp = require("./interfaceHttp");

var InterfaceSpecs = {
    name: "@teleport/device-sdk",
    config: {
        port: 10015,
        lexicon: {},
        connections: {},
        eventHandlers: {}
    },
    eventHandlers: {}
}

var _interface = new Atom.Interface(InterfaceSpecs); //interface is a reserved word in js

_interface.advertiseAndActivate();


component.on("network-config-updated", async (networkConfigUpdateEv) => {
    if(!networkConfigUpdateEv.apply){return;}
    interfaceHttp.addNewRoutes(networkConfigUpdateEv.routes);
});

interfaceHttp.start();

/**
Content-Type: multipart/mixed; boundary="//"
MIME-Version: 1.0
--//
    Content-Type: text/cloud-config; charset="us-ascii"
MIME-Version: 1.0
Content-Transfer-Encoding: 7bit
Content-Disposition: attachment; filename="cloud-config.txt"
#cloud-config
cloud_final_modules:
    - [scripts-user, always]
--//
    Content-Type: text/x-shellscript; charset="us-ascii"
MIME-Version: 1.0
Content-Transfer-Encoding: 7bit
Content-Disposition: attachment; filename="userdata.txt"
#!/bin/bash
ufw disable
iptables -L
iptables -F
--//

 **/