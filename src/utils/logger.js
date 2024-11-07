const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '../../logs/scraping.log');

function logToFile(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${message}\n`;
    
    try {
        fs.appendFileSync(logFile, logMessage);
    } catch (error) {
        console.error('Erreur lors de l\'écriture dans le fichier de log:', error);
    }
}

module.exports = { logToFile };