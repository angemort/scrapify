const socketIo = require('socket.io');
const { logToFile } = require('./utils/logger');
const { checkRateLimit } = require('./utils/rateLimit');
const { validateWebSocketData } = require('./utils/validator');
const ServiceLoader = require('./serviceLoader');

/**
 * Configure et initialise les WebSockets
 * @param {Object} server - Instance du serveur HTTP
 * @returns {Object} - Instance de Socket.IO
 */
function initializeWebSocket(server) {
    const io = socketIo(server, {
        path: '/ws',
        transports: ['websocket'],
        cors: {
            origin: process.env.ALLOWED_ORIGINS?.split(',') || ["http://localhost:3000"],
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log('New client connected');

        socket.on('get-scraping', async (taskData) => {
            try {
                if (!checkRateLimit(socket)) {
                    throw new Error('Too many requests. Please try again later.');
                }

                validateWebSocketData(taskData);

                const sanitizedData = {
                    url: encodeURI(taskData.url.trim()),
                    userTarget: taskData.userTarget?.trim(),
                    platform: taskData.platform.toLowerCase(),
                    action: taskData.action.toLowerCase()
                };

                logToFile(`Starting scraping for ${sanitizedData.url}`);
                
                const service = ServiceLoader.getService(sanitizedData.platform);
                if (!service) {
                    throw new Error(`Unsupported platform: ${sanitizedData.platform}`);
                }
        
                const result = await service.scrape(
                    sanitizedData.url,
                    sanitizedData.action,
                    sanitizedData.userTarget
                );
                
                socket.emit('scraping-completed', {
                    success: true,
                    data: result,
                    taskData: sanitizedData
                });
                
            } catch (error) {
                socket.emit('scraping-error', {
                    success: false,
                    error: error.message,
                    taskData
                });
                logToFile(`Scraping error: ${error.message}`);
            }
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });
    });

    return io;
}

module.exports = { initializeWebSocket };