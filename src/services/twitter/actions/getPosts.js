const { logToFile } = require('../../../utils/logger');

/**
 * @typedef {Object} PostsProfileResult
 * @memberof module:TwitterService
 * @example
 * // Récupérer les posts d'un profil Twitter
 * // Exemple d'utilisation pour 'getPosts'
 * POST /scrape/ (url:'https://x.com/user', action:'getPosts')
 * @property {PostInfo[]} originalPosts - Posts originaux.
 * @property {PostInfo[]} retweets - Retweets.
 */

async function getPosts(context, page, platformUrl) {
    let posts = {
        originalPosts: [],
        retweets: []
    };

    try {
        await context.route('**/UserTweets*', async route => {
            const request = route.request();
            if (request.method() === 'GET') {
                route.continue();
                const response = await request.response();

                if (response.url().includes('UserTweets')) {
                    try {
                        const jsonResponse = await response.json();
                        logToFile('Analyse des tweets et retweets...');

                        const tweets = jsonResponse.data.user.result.timeline_v2.timeline.instructions
                            .flatMap(instruction => instruction.entries || [])
                            .map(entry => entry.content?.itemContent?.tweet_results?.result)
                            .filter(tweet => tweet?.legacy);

                        // Séparer les tweets originaux des retweets
                        tweets.forEach(tweet => {
                            if (tweet.legacy.retweeted_status_result) {
                                posts.retweets.push({
                                    id: tweet.legacy.id_str,
                                    text: tweet.legacy.full_text,
                                    created_at: tweet.legacy.created_at,
                                    original_tweet: {
                                        id: tweet.legacy.retweeted_status_result.result.legacy.id_str,
                                        text: tweet.legacy.retweeted_status_result.result.legacy.full_text,
                                        created_at: tweet.legacy.retweeted_status_result.result.legacy.created_at,
                                        author: tweet.legacy.retweeted_status_result.result.core.user_results.result.legacy.screen_name
                                    }
                                });
                            } else {
                                posts.originalPosts.push({
                                    id: tweet.legacy.id_str,
                                    text: tweet.legacy.full_text,
                                    created_at: tweet.legacy.created_at
                                });
                            }
                        });

                        logToFile(`${posts.originalPosts.length} posts originaux trouvés`);
                        logToFile(`${posts.retweets.length} retweets trouvés`);
                    } catch (error) {
                        logToFile(`Erreur lors de l'analyse de la réponse JSON : ${error.message}`);
                        throw error;
                    }
                }
            } else {
                route.continue();
            }
        });

        await page.goto(platformUrl, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);

        return posts;
    } catch (error) {
        logToFile(`Erreur lors de l'extraction des posts : ${error.message}`);
        throw error;
    }
}

module.exports = { getPosts };