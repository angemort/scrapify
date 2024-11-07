const express = require('express');
const http = require('http');

const { initializeWebSocket } = require('./src/ws');
const { logToFile } = require('./src/utils/logger');
const { validateRequest } = require('./src/utils/validator');
const ServiceLoader = require('./src/serviceLoader');
const { loadStats, saveStats } = require('./src/utils/statsManager');

const dotenv = require('dotenv');
dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = 3000;

// Charger les compteurs depuis le fichier JSON
const stats = loadStats();

initializeWebSocket(server, () => {
    stats.webSocketRequestCount++;
    saveStats(stats); // Sauvegarder les changements
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
            </style>
        </head>
        <body>
            <div class="card">
                <h1>📊 Statistiques d'utilisation</h1>
                <p>🔄 Nombre de requêtes POST : ${stats.postRequestCount}</p>
                <p>🌐 Nombre de requêtes WebSocket : ${stats.webSocketRequestCount}</p>
                <p>✅ Nombre de requêtes réussies : ${stats.successCount}</p>
                <p>❌ Nombre de requêtes en erreur : ${stats.errorCount}</p>
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
    stats.postRequestCount++; // Incrémenter le compteur POST
    saveStats(stats); // Sauvegarder les changements
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

        stats.successCount++;
        saveStats(stats);
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        stats.errorCount++;
        saveStats(stats);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

server.listen(PORT, () => {
    console.log(`Serveur API de scraping écoutant sur le port ${PORT}`);
});