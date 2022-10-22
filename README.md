## Vyom Client agent

This agent is installed on Device which uses in-house hosted localtunnel instance to get a tunnel URL. and it's an express server which creates a proxy endpoint to different services running on the device.

## Installation

```shell
npm install
```

## Usage

```shell
npm run dev
```

# Flow

Once the Agent is started it will start a express server at port and will get a proxy subdomain url from the in-house hosted localtunnel server. it will send the proxy url to the server and will start sending the status of the device to the server.

This agent has capability to create a proxy route to certain port dynamically. it has a runtime controller which takes in config from server and create a user given details for proxy