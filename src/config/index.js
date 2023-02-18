var devConfig = {
    PLATFORM_BACKEND_URL: "http://localhost:8888/",
    TUNNEL_HOST: "http://localhost:3344",
    TUNNEL_CLIENT_ID: process.env.CLIENT_ID,
    TERMINAL_ENDPOINT: process.env.TERMINAL_SERVICE_URL,
    WEBREQUEST_HANDLER_ENDPOINT: process.env.REQUEST_HANDLER_URL,
    SYNC_FREQUENCY: 10000,
    LOCAL_PORT: process.env.LOCAL_PORT || 3000
}

var prodConfig = {
    PLATFORM_BACKEND_URL: "https://teleport.vyom.cc/",
    TUNNEL_HOST: "https://localtunnel.vyom.cc",
    TUNNEL_CLIENT_ID: process.env.CLIENT_ID,
    TERMINAL_ENDPOINT: process.env.TERMINAL_SERVICE_URL,
    WEBREQUEST_HANDLER_ENDPOINT: process.env.REQUEST_HANDLER_URL,
    SYNC_FREQUENCY: 10000,
    LOCAL_PORT: process.env.LOCAL_PORT || 3000
}

var config = process.env.NODE_ENV === 'development' ? devConfig : prodConfig

export default config;