const path = require('path');
const { chromium } = require('playwright');

const { getProxy } = require('../../utils/proxy');
const { logToFile } = require('../../utils/logger');
const { initializeTwitterSession, detectAction } = require('./actions/login');
const { getPostMetrics, getProfileMetrics } = require('./actions/getMetrics');
const { getRecentComments, getUserComments } = require('./actions/getComments');
const { verifyRetweet } = require('./actions/verifyRetweet');
const { getPosts } = require('./actions/getPosts');

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
 * @param {string} action - Action à effectuer (ex: 'getMetrics', 'verifyRetweet', 'checkUserComment', 'getRecentComments', 'getPosts').
 * @param {string} [userTarget=null] - Nom d'utilisateur cible, requis pour certaines actions (ex: 'verifyRetweet', 'checkUserComment').
 * @returns {Promise<MetricsPostResult|MetricsProfileResult|VerifyRetweetResult|CheckUserCommentResult|GetRecentCommentsResult|PostsProfileResult>} Résultat de l'action de scraping, selon l'action spécifiée.
 *
 * @example
 * // Exemple d'utilisation pour 'verifyRetweet'
 * POST /scrape/ (url:'https://x.com/user/status/1234567890', action:'verifyRetweet', userTarget:'@KnightsonBase')
 *
 * // Exemple d'utilisation pour 'getMetrics'
 * POST /scrape/ (url:'https://x.com/user/status/1234567890', action:'getMetrics')
 * -- OR --
 * POST /scrape/ (url:'https://x.com/user', action:'getMetrics')
 * 
 * // Exemple d'utilisation pour 'getRecentComments'
 * POST /scrape/ (url:'https://x.com/user/status/1234567890', action:'getRecentComments')
 * 
 * // Exemple d'utilisation pour 'getPosts'
 * POST /scrape/ (url:'https://x.com/user', action:'getPosts')
 */
async function scrape(platformUrl, action, userTarget=null) {
    logToFile(`Starting agent for ${action}...`);
    let browser;
    try {
        browser = await chromium.launch({ headless: true, slowMo: 2800 });
        const context = await browser.newContext({
            proxy: getProxy(),
            storageState: path.join(__dirname, '../../../data/twitter-state.json')
        });
        let page = await context.newPage();
        await initializeTwitterSession(context, page);

        // Detect action
        const actionTarget = await detectAction(platformUrl); // post or profile
        logToFile(`Detected target: ${actionTarget}`);

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
            } else if (action === 'getPosts') {
                result = await getPosts(context, page, platformUrl);
            }
        }

        logToFile(`Agent completed successfully`);
        return result;
    } catch (error) {
        logToFile(`Agent error: ${error.message}`);
    } finally {
        if (browser) {
            logToFile('Closing browser...');
            await browser.close();
        }
    }
}

module.exports = { scrape };

/**
 * @typedef {Object} WebsiteInfo
 * @description Informations du site web.
 * @memberof module:TwitterService
 * @property {string} name - Nom du site web.
 * @property {string} url - URL du site web.
 */

/**
 * @typedef {Object} PostInfo
 * @description Informations du post.
 * @memberof module:TwitterService
 * @property {string} content - Contenu du post.
 * @property {string} lang - Langue du post.
 * @property {string} created_at - Date de création du post.
 * @property {string} conversation_id - Identifiant de la conversation.
 * @property {MediaInfo[]} medias - Médias du post.
 * @property {string} link - URL du post.
 */

/**
 * @typedef {Object} UserMentionInfo
 * @description Informations de l'utilisateur mentionné.
 * @memberof module:TwitterService
 * @property {string} name - Nom de l'utilisateur mentionné.
 * @property {string} screen_name - Nom d'utilisateur (handle) de l'utilisateur mentionné.
 * @property {string} id - Identifiant de l'utilisateur mentionné.
 */

/** 
 * @typedef {Object} CommentInfo
 * @description Informations du commentaire.
 * @memberof module:TwitterService
 * @property {string} id - ID du commentaire.
 * @property {string} content - Contenu du commentaire.
 * @property {string} created_at - Date du commentaire.
 * @property {MediaInfo[]} media - Médias du commentaire.
 * @property {MetricsInfo} metrics - Métriques du commentaire.
 * @property {CommentInfo[]} replies - Réponses au commentaire.
 */