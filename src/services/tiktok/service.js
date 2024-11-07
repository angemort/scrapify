const { chromium } = require('playwright');
const path = require('path');

const { getProxy } = require('../../utils/proxy');
const { logToFile } = require('../../utils/logger');
const { initializeTiktokSession, detectAction } = require('./actions/login');
const { getPostMetrics, getProfileMetrics } = require('./actions/getMetrics');

/**
 * @module TikTokService
 * @description Module pour les actions de scraping sur Tiktok.
 */

/**
 * Exécute une action de scraping sur Tiktok.
 *
 * @function scrape
 * @memberof module:TikTokService
 * @static
 *
 * @param {string} platformUrl - URL de la plateforme cible (post ou profil).
 * @param {string} action - Action à effectuer (ex: 'getMetrics', 'getProfileMetrics').
 * @returns {Promise<MetricsPostResult|MetricsProfileResult>} Résultat de l'action de scraping.
 *
 * @example
 * // Exemple d'utilisation pour 'getMetrics'
 * const result = await scrape('https://tiktok.com/user/1234567890', 'getMetrics');
 * -- OR --
 * const result = await scrape('https://tiktok.com/user', 'getMetrics');
 */
async function scrape(platformUrl, action, userTarget=null) {
    logToFile(`Démarrage du scraping pour ${platformUrl} avec l'action ${action}...`);
    let browser;
    try {
        browser = await chromium.launch({ headless: false, slowMo: 5500 });
        const context = await browser.newContext({
            proxy: getProxy(),
            storageState: path.join(__dirname, '../../../data/tiktok-state.json'),
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.141 Safari/537.36'
        });
        const page = await context.newPage();
        // await initializeTiktokSession(context, page);

        // Detect action
        const actionTarget = await detectAction(platformUrl); // post or profile
        logToFile(`Action détectée : ${actionTarget} ${platformUrl}`);
        // await page.goto(platformUrl, { waitUntil: 'domcontentloaded' });

        let result;
        // For scraping Post Tiktok
        if (actionTarget === 'post') {
            logToFile(`Scraping post ${platformUrl}`);
            if (action === 'getMetrics') {
                result = await getPostMetrics(page, platformUrl);
             } //else if (action === 'downloadComments') {
            //     result = await downloadComments(page);
            // } else if (action === 'checkUserComment' && userTarget) {
            //     result = await checkUserComment(page, userTarget);
            // }
        } 
        // For scraping Profile Tiktok
        else if (actionTarget === 'profile') {
            logToFile(`Scraping profile ${platformUrl}`);
            if (action === 'getMetrics') {
                result = await getProfileMetrics(page, platformUrl);
            }
        }

        logToFile(`Scraping terminé avec le résultat : ${JSON.stringify(result)}`);
        return result;
    } catch (error) {
        logToFile(`Erreur de scraping : ${error.message}`);
    } finally {
        if (browser) {
            logToFile('Fermeture du navigateur...');
            await browser.close();
        }
    }
}

module.exports = { scrape };

/**
 * @typedef {Object} MetricsPostResult
 * @memberof module:TikTokService
 * @property {string} id - Identifiant du post.
 * @property {string} content - Contenu du post.
 * @property {string} createdAt - Date de création du post.
 * @property {AuthorPostInfo} author - Informations sur l'auteur du post.
 * @property {MetricsPostInfo} stats - Informations sur les métriques du post.
 * @property {VideoInfo} video - Informations sur la vidéo du post.
 * @property {MusicInfo} music - Informations sur la musique du post.
 */

/**
 * @typedef {Object} MetricsProfileResult
 * @memberof module:TikTokService
 * @property {AuthorProfileInfo} user - Informations sur l'auteur du profil.
 * @property {MetricsProfileInfo} stats - Informations sur les métriques du profil.
 */
