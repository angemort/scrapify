// Middleware de rate limiting pour WebSocket
const socketRateLimit = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 10;

const checkRateLimit = (socket) => {
    const now = Date.now();
    const clientIP = socket._socket.remoteAddress;
    
    if (!socketRateLimit.has(clientIP)) {
        socketRateLimit.set(clientIP, [{timestamp: now}]);
        return true;
    }

    const requests = socketRateLimit.get(clientIP);
    const recentRequests = requests.filter(req => now - req.timestamp < RATE_LIMIT_WINDOW);
    
    if (recentRequests.length >= MAX_REQUESTS) {
        return false;
    }

    recentRequests.push({timestamp: now});
    socketRateLimit.set(clientIP, recentRequests);
    return true;
};

module.exports = {
    checkRateLimit
};