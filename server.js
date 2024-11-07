const express = require('express');
const http = require('http');

const { initializeWebSocket } = require('./src/ws');
const { logToFile } = require('./src/utils/logger');
const { validateRequest } = require('./src/utils/validator');
const ServiceLoader = require('./src/serviceLoader');
const { 
    loadStats, 
    loadLogs, 
    incrementSuccessCount,
    incrementErrorCount,
    incrementPostRequestCount,
    incrementWebSocketRequestCount 
} = require('./src/utils/statsManager');

const dotenv = require('dotenv');
dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = 3000;

// Charger les compteurs depuis le fichier JSON
const stats = loadStats();
const logs = loadLogs();

initializeWebSocket(server, () => {
    incrementWebSocketRequestCount();
});

app.use(express.json());

// Page d'accueil pour afficher les compteurs
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    min-height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    font-family: Arial, sans-serif;
                    background-color: #1a1a1a;
                    color: #ffffff;
                }
                .card {
                    background-color: #2d2d2d;
                    padding: 2rem;
                    border-radius: 15px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
                    min-width: 300px;
                }
                code {
                    white-space: pre-wrap;
                    font-size: 12px;
                    font-family: monospace;
                }
                h1 {
                    margin-top: 0;
                    text-align: center;
                    color: #ffffff;
                    font-size: 1.8rem;
                    margin-bottom: 1.5rem;
                }
                p {
                    margin: 1rem 0;
                    padding: 0.8rem;
                    background-color: #3d3d3d;
                    border-radius: 8px;
                    transition: transform 0.2s;
                }
                p:hover {
                    transform: translateX(5px);
                }
                .log-line {
                    margin: 0.2rem 0;
                    padding: 0.5rem;
                    background-color: #444;
                    border-radius: 5px;
                }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>📊 Usage Statistics</h1>
                <p>🔄 POST requests count: ${stats.postRequestCount}</p>
                <p>🌐 WebSocket requests count: ${stats.webSocketRequestCount}</p>
                <p>✅ Successful requests count: ${stats.successCount}</p>
                <p>❌ Error requests count: ${stats.errorCount}</p>
                <div>
                    ${logs.split('\n').map(line => `<div class="log-line">${line}</div>`).join('')}
                </div>
            </div>
        </body>
        </html>
    `);
});

// Initialiser le chargement des services au démarrage
(async () => {
    await ServiceLoader.loadServices();
})();

app.post('/scrape', validateRequest, async (req, res) => {
    incrementPostRequestCount();
    
    try {
        const sanitizedData = {
            url: encodeURI(req.body.url.trim()),
            userTarget: req.body.userTarget ? req.body.userTarget.trim() : null,
            platform: req.body.platform.toLowerCase(),
            action: req.body.action
        };

        logToFile(`Manual scraping started for ${sanitizedData.url}`);
        
        const service = ServiceLoader.getService(sanitizedData.platform);
        if (!service) {
            incrementErrorCount();
            throw new Error(`Unsupported platform: ${sanitizedData.platform}`);
        }

        const result = await service.scrape(
            sanitizedData.url,
            sanitizedData.action,
            sanitizedData.userTarget
        );

        incrementSuccessCount();
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        incrementErrorCount();
        logToFile(`Error during scraping: ${error.message}`);
        
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

server.listen(PORT, () => {
    console.log(`API de scraping listening on port ${PORT}`);
});