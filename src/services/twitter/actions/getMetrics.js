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
        await context.route('**/TweetDetail*', async route => {
            const request = route.request();
            if (request.method() === 'GET') {
                route.continue();
                const response = await request.response();
                if (response.url().includes('TweetDetail')) {
                    const jsonResponse = await response.json();
                    
                    const tweetEntry = jsonResponse.data?.threaded_conversation_with_injections_v2
                        ?.instructions?.[0]?.entries?.[0]?.content?.itemContent?.tweet_results?.result;

                    if (!tweetEntry) {
                        logToFile('No tweet data found');
                        return;
                    }

                    const user = userSegment(tweetEntry) || {
                        username: 'unknown',
                        name: 'unknown',
                        certified: false
                    };

                    const medias = mediaSegment(tweetEntry) || [];
                    const metrics = metricsSegment(tweetEntry) || {
                        likes: 0,
                        retweets: 0,
                        replies: 0,
                        views: 0
                    };

                    const post = {
                        content: tweetEntry.legacy?.full_text || '',
                        lang: tweetEntry.legacy?.lang || 'unknown',
                        created_at: tweetEntry.legacy?.created_at || null,
                        conversation_id: tweetEntry.legacy?.conversation_id_str || null,
                        medias: medias,
                        link: tweetEntry.note_tweet?.note_tweet_results?.result?.entity_set?.urls?.[0]?.expanded_url || null
                    };

                    const hashtags = tweetEntry.legacy?.entities?.hashtags?.map(tag => tag.text) || [];
                    const user_mentions = tweetEntry.legacy?.entities?.user_mentions?.map(mention => ({
                        name: mention.name || 'unknown',
                        screen_name: mention.screen_name || 'unknown',
                        id: mention.id_str || 'unknown'
                    })) || [];
                    const urls = tweetEntry.legacy?.entities?.urls?.map(url => url.expanded_url) || [];

                    tweetData = {
                        user,
                        post,
                        metrics,
                        hashtags,
                        user_mentions,
                        urls
                    };

                    if (hasMinimalUsefulData(tweetData)) {
                        logToFile(`Extracted data (partial or complete): ${JSON.stringify(tweetData)}`);
                    } else {
                        logToFile('Insufficient data extracted');
                        tweetData = null;
                    }
                }
            } else {
                route.continue();
            }
        });

        await page.goto(platformUrl, { waitUntil: 'networkidle0' });
        await page.waitForTimeout(3000);
        await page.close();

        if (!tweetData) {
            throw new Error('Unable to extract useful data from the post.');
        }

        return tweetData;

    } catch (error) {
        logToFile(`Critical error during data extraction: ${error.message}`);
        throw error;
    }
}

function hasMinimalUsefulData(data) {
    return !!(
        data &&
        (
            (data.post && data.post.content) ||
            (data.metrics && (data.metrics.likes !== undefined || data.metrics.retweets !== undefined)) ||
            (data.user && data.user.username)
        )
    );
}

async function getProfileMetrics(context, page, platformUrl) {
    let profileData = null;

    try {
        await context.route('**/UserByScreenName*', async route => {
            const request = route.request();
            if (request.method() === 'GET') {
                route.continue();
                const response = await request.response();
                if (response.url().includes('UserByScreenName')) {
                    const jsonResponse = await response.json();
                    
                    const userResult = jsonResponse.data?.user?.result;
                    const legacy = userResult?.legacy;

                    if (!userResult) {
                        logToFile('No profile data found');
                        return;
                    }

                    const user = {
                        username: legacy?.screen_name || 'unknown',
                        name: legacy?.name || 'unknown',
                        certified: userResult.is_blue_verified || false,
                        is_identity_verified: userResult?.verification_info?.is_identity_verified || false,
                        avatar: legacy?.profile_image_url_https || null,
                        cover: legacy?.profile_banner_url || null,
                        bio: legacy?.description || '',
                        location: legacy?.location || null,
                        joined: legacy?.created_at || null,
                        birthdate: legacy?.birthdate || null,
                    };

                    const metrics = {
                        followers: legacy?.followers_count || 0,
                        following: legacy?.friends_count || 0,
                        tweet_count: legacy?.statuses_count || 0,
                        likes_count: legacy?.favourites_count || 0,
                        media_count: legacy?.media_count || 0
                    };

                    profileData = {
                        user,
                        website: {
                            name: legacy?.entities?.url?.urls[0]?.display_url || null,
                            url: legacy?.entities?.url?.urls[0]?.expanded_url || null
                        },
                        metrics,
                        professional: userResult.professional?.professional_type || null,
                        categories: userResult.professional?.category || [],
                        pinned_tweet_ids: legacy?.pinned_tweet_ids_str || [],
                        highlights: userResult.highlights_info?.highlighted_tweets || 0,
                        can_highlight_tweets: userResult.highlights_info?.can_highlight_tweets || false,
                    };

                    if (hasMinimalProfileData(profileData)) {
                        logToFile(`Extracted profile data: ${JSON.stringify(profileData)}`);
                    } else {
                        logToFile('Insufficient profile data');
                        profileData = null;
                    }
                }
            } else {
                route.continue();
            }
        });

        await page.goto(platformUrl, { waitUntil: 'networkidle0' });
        await page.waitForTimeout(3000);

        if (!profileData) {
            throw new Error('Unable to extract useful data from the profile.');
        }

        return profileData;

    } catch (error) {
        logToFile(`Erreur critique lors de l'extraction du profil: ${error.message}`);
        throw error;
    }
}

function hasMinimalProfileData(data) {
    return !!(
        data &&
        (
            (data.user && (data.user.username || data.user.name)) ||
            (data.metrics && (data.metrics.followers !== undefined || data.metrics.tweet_count !== undefined))
        )
    );
}

module.exports = { getPostMetrics, getProfileMetrics };