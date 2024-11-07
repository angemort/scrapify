const WebSocket = require('ws');
const { logToFile } = require('./utils/logger');
const { checkRateLimit } = require('./utils/rateLimit');
const { validateWebSocketData } = require('./utils/validator');
const ServiceLoader = require('./serviceLoader');
const { 
    incrementSuccessCount,
    incrementErrorCount,
} = require('./utils/statsManager');

/**
 * Configure et initialise les WebSockets
 * @param {Object} server - Instance du serveur HTTP
 * @returns {Object} - Instance de WebSocket.Server
 */
function initializeWebSocket(server) {
    const wss = new WebSocket.Server({ 
        server,
        path: '/ws'
    });

    wss.on('connection', (ws) => {
        console.log('New client connected');

        ws.on('message', async (message) => {
            try {
                const parsedMessage = JSON.parse(message);
                
                // Vérifiez le type de message pour garantir qu'il s'agit bien d'un message de scraping
                if (parsedMessage.type !== 'get-scraping' || !parsedMessage.payload) {
                    throw new Error("Invalid message type or missing payload");
                }

                const taskData = parsedMessage.payload;
                
                // Vérification de la limite de taux
                if (!checkRateLimit(ws)) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        payload: {
                            success: false,
                            error: 'Too many requests. Please try again later.'
                        }
                    }));
                    incrementErrorCount();
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
                
                ws.send(JSON.stringify({
                    type: 'scraping-completed',
                    payload: {
                        success: true,
                        data: result,
                        taskData: sanitizedData
                    }
                }));
                incrementSuccessCount();
            } catch (error) {
                ws.send(JSON.stringify({
                    type: 'scraping-error',
                    payload: {
                        success: false,
                        error: error.message,
                        taskData: parsedMessage.payload
                    }
                }));
                logToFile(`Scraping error: ${error.message}`);
                incrementErrorCount();
            }
        });

        ws.on('close', () => {
            console.log('Client disconnected');
        });
    });

    return wss;
}

module.exports = { initializeWebSocket };