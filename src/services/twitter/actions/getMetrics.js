const { logToFile } = require('../../../utils/logger');
const { mediaSegment } = require('../segments/media');
const { metricsSegment } = require('../segments/metrics');
const { userSegment } = require('../segments/user');

/**
 * @typedef {Object} MetricsPostResult
 * @memberof module:TwitterService
 * @description Résultat des métriques d'un post Twitter.
 * @property {UserInfo} user - Informations de l'utilisateur.
 * @property {PostInfo} post - Informations du post.
 * @property {MetricsInfo} metrics - Métriques du post.
 * @property {string[]} hashtags - Hashtags du post.
 * @property {UserMentionInfo[]} user_mentions - Mention utilisateur.
 * @property {string[]} urls - URL.
 */

/**
 * @typedef {Object} PostInfo
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
 * @memberof module:TwitterService
 * @property {string} name - Nom de l'utilisateur mentionné.
 * @property {string} screen_name - Nom d'utilisateur (handle) de l'utilisateur mentionné.
 * @property {string} id - Identifiant de l'utilisateur mentionné.
 */

async function getPostMetrics(context, page, platformUrl) {
    let tweetData = null;

    try {
            // Configurer l'interception de la requête TweetDetail
        await context.route('**/TweetDetail*', async route => {
            const request = route.request();
            if (request.method() === 'GET') {
                route.continue();
                const response = await request.response();
                if (response.url().includes('TweetDetail')) {
                    const jsonResponse = await response.json();
                    logToFile('Analyse TweetDetail...');

                    // Extraction du tweet et de l'utilisateur
                    const tweetEntry = jsonResponse.data.threaded_conversation_with_injections_v2.instructions[0].entries[0].content.itemContent.tweet_results.result;

                    // Informations utilisateur
                    const user = userSegment(tweetEntry);

                    // Médias du tweet
                    const medias = mediaSegment(tweetEntry);

                    // Informations du post
                    const post = {
                        content: tweetEntry.legacy.full_text,
                        lang: tweetEntry.legacy.lang,
                        created_at: tweetEntry.legacy.created_at,
                        conversation_id: tweetEntry.legacy.conversation_id_str,
                        medias: medias,
                        link: tweetEntry.note_tweet?.note_tweet_results?.result?.entity_set?.urls[0]?.expanded_url || null
                    };

                    // Extraction des hashtags, mentions, et URLs
                    const hashtags = tweetEntry.legacy.entities?.hashtags.map(tag => tag.text) || [];
                    const user_mentions = tweetEntry.legacy.entities?.user_mentions.map(mention => ({
                        name: mention.name,
                        screen_name: mention.screen_name,
                        id: mention.id_str
                    })) || [];
                    const urls = tweetEntry.legacy.entities?.urls.map(url => url.expanded_url) || [];

                    // Structure des métriques
                    const metrics = metricsSegment(tweetEntry);

                    // Regrouper toutes les données
                    tweetData = {
                        user,
                        post,
                        metrics,
                        hashtags,
                        user_mentions,
                        urls
                    };

                    logToFile(`Données extraites : ${JSON.stringify(tweetData)}`);
                }
            } else {
                route.continue();
            }
        });

        // Naviguer à la page du tweet pour déclencher les requêtes réseau
        await page.goto(platformUrl, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000); // Attendre pour garantir que les requêtes réseau sont terminées
    } catch (error) {
        logToFile(`Erreur lors de l'extraction des données du post : ${error}`);
    }

    return tweetData;
}

// Get metrics from the profile page
// @param {Page} page - The page object
// @returns {Object} - The metrics object
async function getProfileMetrics(context, page, platformUrl) {
    let profileData = null;

    // Configurer l'interception de la requête UserByScreenName
    await context.route('**/UserByScreenName*', async route => {
        const request = route.request();
        if (request.method() === 'GET') {
            route.continue();
            const response = await request.response();
            if (response.url().includes('UserByScreenName')) {
                const jsonResponse = await response.json();
                logToFile('Analyse UserByScreenName...');

                // Extraire les données du profil de l'utilisateur
                const userResult = jsonResponse.data.user.result;
                const legacy = userResult.legacy;

                // Informations de base de l'utilisateur
                const user = {
                    username: legacy.screen_name,
                    name: legacy.name,
                    certified: userResult.is_blue_verified,
                    is_identity_verified: userResult?.verification_info?.is_identity_verified || null,
                    avatar: legacy.profile_image_url_https,
                    cover: legacy.profile_banner_url || null,
                    bio: legacy.description,
                    location: legacy.location || null,
                    joined: legacy.created_at,
                    birthdate: legacy.birthdate || null,
                };

                // Liens et informations associées
                const website = legacy.entities?.url?.urls[0] || {};
                const websiteData = {
                    name: website.display_url || null,
                    url: website.expanded_url || null
                };

                // Statistiques du profil
                const metrics = {
                    followers: legacy.followers_count || 'Non disponible',
                    following: legacy.friends_count || 'Non disponible',
                    tweet_count: legacy.statuses_count || 'Non disponible',
                    likes_count: legacy.favourites_count || 'Non disponible',
                    media_count: legacy.media_count || 'Non disponible'
                };

                // Compte professionnel
                const professional = userResult.professional?.professional_type || null;
                const categories = userResult.professional?.category || [];

                profileData = {
                    user,
                    website: websiteData,
                    metrics,
                    professional,
                    categories,
                    pinned_tweet_ids: legacy.pinned_tweet_ids_str.map(id => id) || null,
                    highlights: userResult.highlights_info?.highlighted_tweets || 0,
                    can_highlight_tweets: userResult.highlights_info?.can_highlight_tweets || false,
                };

                logToFile(`Données extraites : ${JSON.stringify(profileData)}`);
            }
        } else {
            route.continue();
        }
    });

    // Naviguer vers la page de profil pour déclencher les requêtes réseau
    await page.goto(platformUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000); // Attendre pour garantir que les requêtes réseau sont terminées

    return profileData;
}

module.exports = { getPostMetrics, getProfileMetrics };