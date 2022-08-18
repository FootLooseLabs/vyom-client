var devConfig = {
    PLATFORM_BACKEND_URL: "http://localhost:8888/",
    TUNNEL_CLIENT_ID: process.env.CLIENT_ID,
    TERMINAL_SERVICE_URL: process.env.TERMINAL_SERVICE_URL
}

var prodConfig = {
    PLATFORM_BACKEND_URL: "http://localhost:8888/",
    TUNNEL_CLIENT_ID: process.env.CLIENT_ID,
    TERMINAL_SERVICE_URL: process.env.TERMINAL_SERVICE_URL
}

var config = process.env.NODE_ENV === 'development' ? devConfig : prodConfig

export default config;