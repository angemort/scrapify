const { logToFile } = require('../../../utils/logger');

const { authorSegment } = require('../segments/author');
const { metricsSegment } = require('../segments/metrics');
const { videoSegment } = require('../segments/video');
const { musicSegment } = require('../segments/music');

// Get metrics from the TikTok page
// @param {Page} page - The page object
// @returns {Object} - The metrics object
async function getPostMetrics(page, platformUrl) {
    try {
        // Charger la page de profil
        await page.goto(platformUrl, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000); // Attendre le chargement complet

        // Extraire le contenu du script JSON
        const postInfo = await page.evaluate(() => {
            const scriptTag = document.querySelector('#__UNIVERSAL_DATA_FOR_REHYDRATION__');
            if (!scriptTag) return null;
            
            const jsonData = JSON.parse(scriptTag.innerHTML);

            // Vérifier la structure et extraire les informations de l'utilisateur
            return jsonData.__DEFAULT_SCOPE__['webapp.video-detail'].itemInfo.itemStruct;
        });

        if (!postInfo) {
            logToFile('Erreur : Impossible de trouver les données de profil dans le HTML.');
            return {};
        }

        // Traiter les données récupérées avec vos fonctions en Node.js
        const user = authorSegment(postInfo.author);
        const stats = metricsSegment(postInfo.stats, 'post');
        const video = videoSegment(postInfo.video);
        const music = musicSegment(postInfo.music);

        const post = {
            id: postInfo.id,
            content: postInfo.desc,
            createdAt: postInfo.createTime,
            author: user,
            stats,
            video,
            music
        };

        return post;
    } catch (error) {
        logToFile(`Erreur lors de l'extraction des métriques depuis le HTML: ${error}`);
        return {};
    }
}


// Fonction pour récupérer les informations de profil depuis le HTML de la page
// @param {Page} page - The page object
// @param {String} platformUrl - The platform URL
// @returns {Object} - The profile data
async function getProfileMetrics(page, platformUrl) {
    try {
        // Charger la page de profil
        await page.goto(platformUrl, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000); // Attendre le chargement complet

        // By pass captcha
        // await byPassCaptcha(page);

        // Extraire le contenu du script JSON
        const userInfo = await page.evaluate(() => {
            const scriptTag = document.querySelector('#__UNIVERSAL_DATA_FOR_REHYDRATION__');
            if (!scriptTag) return null;
            
            const jsonData = JSON.parse(scriptTag.innerHTML);

            // Vérifier la structure et extraire les informations de l'utilisateur
            return jsonData.__DEFAULT_SCOPE__['webapp.user-detail'].userInfo;
        });

        if (!userInfo) {
            logToFile('Erreur : Impossible de trouver les données de profil dans le HTML.');
            return {};
        }

        // Traiter les données récupérées avec vos fonctions en Node.js
        const user = authorSegment(userInfo.user);
        const stats = metricsSegment(userInfo.stats, 'profile');

        return {
            user,
            stats
        };

    } catch (error) {
        logToFile(`Erreur lors de l'extraction du profil depuis le HTML: ${error}`);
        return {};
    }
}

module.exports = { getPostMetrics, getProfileMetrics };