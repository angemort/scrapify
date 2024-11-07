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
        cors: {
            origin: process.env.ALLOWED_ORIGINS?.split(',') || "http://localhost:8080",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log('Nouveau client connecté');

        socket.on('get-scraping', async (taskData) => {
            try {
                if (!checkRateLimit(socket)) {
                    throw new Error('Trop de requêtes. Veuillez réessayer plus tard.');
                }

                validateWebSocketData(taskData);

                const sanitizedData = {
                    url: encodeURI(taskData.url.trim()),
                    userTarget: taskData.userTarget?.trim(),
                    platform: taskData.platform.toLowerCase(),
                    action: taskData.action.toLowerCase()
                };

                logToFile(`Démarrage du scraping pour ${sanitizedData.url}`);
                
                const service = ServiceLoader.getService(sanitizedData.platform);
                if (!service) {
                    throw new Error(`Plateforme non supportée: ${sanitizedData.platform}`);
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
                logToFile(`Erreur de scraping: ${error.message}`);
            }
        });

        socket.on('disconnect', () => {
            console.log('Client déconnecté');
        });
    });

    return io;
}

module.exports = { initializeWebSocket };