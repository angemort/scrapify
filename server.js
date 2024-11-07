const express = require('express');
const http = require('http');

const { initializeWebSocket } = require('./src/ws');
const { logToFile } = require('./src/utils/logger');
const { validateRequest } = require('./src/utils/validator');
const ServiceLoader = require('./src/serviceLoader');

const app = express();
const server = http.createServer(app);
const PORT = 3000;

// Initialisation des WebSockets
initializeWebSocket(server);

app.use(express.json());

// Initialiser le chargement des services au démarrage
(async () => {
    await ServiceLoader.loadServices();
})();

app.post('/scrape', validateRequest, async (req, res) => {
    try {
        const sanitizedData = {
            url: encodeURI(req.body.url.trim()),
            userTarget: req.body.userTarget ? req.body.userTarget.trim() : null,
            platform: req.body.platform.toLowerCase(),
            action: req.body.action
        };

        logToFile(`Scraping manuel démarré pour ${sanitizedData.url}`);
        
        const service = ServiceLoader.getService(sanitizedData.platform);
        if (!service) {
            throw new Error(`Plateforme non supportée: ${sanitizedData.platform}`);
        }

        const result = await service.scrape(
            sanitizedData.url,
            sanitizedData.action,
            sanitizedData.userTarget
        );
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

server.listen(PORT, () => {
    console.log(`Serveur API de scraping écoutant sur le port ${PORT}`);
});