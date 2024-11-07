module.exports = {
    getProxy: () => {
        const proxy = {
            server: process.env.PROXY_SERVER,
            username: process.env.PROXY_USERNAME,
            password: process.env.PROXY_PASSWORD
        };
        return proxy;
    }
};