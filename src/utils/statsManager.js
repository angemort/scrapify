const fs = require('fs');
const path = require('path');

const statsFilePath = path.join(__dirname, '../../data/stats.json');

// Fonction pour initialiser le fichier avec des valeurs par défaut
function initializeStatsFile() {
    if (!fs.existsSync(statsFilePath)) {
        const defaultStats = { postRequestCount: 0, webSocketRequestCount: 0, successCount: 0, errorCount: 0 };
        fs.writeFileSync(statsFilePath, JSON.stringify(defaultStats, null, 2), 'utf-8');
    }
}

// Charger les statistiques depuis le fichier
function loadStats() {
    initializeStatsFile(); // S'assurer que le fichier existe
    const data = fs.readFileSync(statsFilePath, 'utf-8');
    return JSON.parse(data);
}

// Sauvegarder les statistiques dans le fichier
function saveStats(stats) {
    fs.writeFileSync(statsFilePath, JSON.stringify(stats, null, 2), 'utf-8');
}

module.exports = { loadStats, saveStats };