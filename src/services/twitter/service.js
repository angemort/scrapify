const path = require('path');
const { chromium } = require('playwright');

const { getProxy } = require('../../utils/proxy');
const { logToFile } = require('../../utils/logger');
const { initializeTwitterSession, detectAction } = require('./actions/login');
const { getPostMetrics, getProfileMetrics } = require('./actions/getMetrics');
const { getRecentComments, getUserComments } = require('./actions/getComments');
const { verifyRetweet } = require('./actions/verifyRetweet');

/**
 * @module TwitterService
 * @description Module pour les actions de scraping sur Twitter.
 */

/**
 * Exécute une action de scraping sur X (anciennement Twitter).
 *
 * @function scrape
 * @memberof module:TwitterService
 * @static
 * 
 * @param {string} platformUrl - URL de la plateforme cible (post ou profil).
 * @param {string} action - Action à effectuer (ex: 'getMetrics', 'verifyRetweet', 'checkUserComment', 'getRecentComments', 'getProfileMetrics').
 * @param {string} [userTarget=null] - Nom d'utilisateur cible, requis pour certaines actions (ex: 'verifyRetweet', 'checkUserComment').
 * @returns {Promise<MetricsPostResult|MetricsProfileResult|VerifyRetweetResult|CheckUserCommentResult|GetRecentCommentsResult>} Résultat de l'action de scraping, selon l'action spécifiée.
 *
 * @example
 * // Exemple d'utilisation pour 'verifyRetweet'
 * const result = await scrape('https://x.com/user/status/1234567890', 'verifyRetweet', '@KnightsonBase');
 *
 * // Exemple d'utilisation pour 'getMetrics'
 * const result = await scrape('https://x.com/user/status/1234567890', 'getMetrics');
 * -- OR --
 * const result = await scrape('https://x.com/user', 'getMetrics');
 */
async function scrape(platformUrl, action, userTarget=null) {
    logToFile(`Démarrage de l'agent pour ${action}...`);
    let browser;
    try {
        browser = await chromium.launch({ headless: true, slowMo: 2500 });
        const context = await browser.newContext({
            // proxy: getProxy(),
            storageState: path.join(__dirname, '../../../data/twitter-state.json')
        });
        let page = await context.newPage();
        await initializeTwitterSession(context, page);

        // Detect action
        const actionTarget = await detectAction(platformUrl); // post or profile
        logToFile(`Cible détectée : ${actionTarget}`);

        let result;
        // For scraping Post Twitter
        if (actionTarget === 'post') {
            logToFile(`Post ${platformUrl}`);
            if (action === 'getMetrics') {
                result = await getPostMetrics(context, page, platformUrl);
            } else if (action === 'getRecentComments') {
                result = await getRecentComments(context, page, platformUrl);
            } else if (action === 'checkUserComment' && userTarget) {
                result = await getUserComments(context, page, platformUrl, userTarget);
            } else if (action === 'verifyRetweet') {
                result = await verifyRetweet(context, page, platformUrl, userTarget);
            }
        } 
        // For scraping Profile Twitter
        else if (actionTarget === 'profile') {
            logToFile(`Profile ${platformUrl}`);
            if (action === 'getMetrics') {
                result = await getProfileMetrics(context, page, platformUrl);
            }
        }

        logToFile(`Agent terminé avec le résultat : ${JSON.stringify(result)}`);
        return result;
    } catch (error) {
        logToFile(`Erreur de l'agent : ${error.message}`);
    } finally {
        if (browser) {
            logToFile('Fermeture du navigateur...');
            await browser.close();
        }
    }
}

module.exports = { scrape };


/**
 * @typedef {Object} VerifyRetweetResult
 * @memberof module:TwitterService
 * @property {boolean} has_retweeted - Indique si l'utilisateur a retweeté le post.
 * @property {string} retweet_date - Date du retweet.
 */

/**
 * @typedef {Object} CheckUserCommentResult
 * @memberof module:TwitterService
 * @property {boolean} has_commented - Indique si l'utilisateur a commenté le post.
 * @property {int} comments_count - Nombre de commentaires.
 * @property {CommentInfo[]} comments - Contenu du commentaire.
 */

/**
 * @typedef {Object} GetRecentCommentsResult
 * @memberof module:TwitterService
 * @property {int} comments_count - Nombre de commentaires.
 * @property {CommentInfo[]} comments - Contenu du commentaire.
 */

/** 
 * @typedef {Object} CommentInfo
 * @memberof module:TwitterService
 * @property {string} id - ID du commentaire.
 * @property {string} content - Contenu du commentaire.
 * @property {string} created_at - Date du commentaire.
 * @property {MediaInfo[]} media - Médias du commentaire.
 * @property {MetricsInfo} metrics - Métriques du commentaire.
 * @property {CommentInfo[]} replies - Réponses au commentaire.
 */