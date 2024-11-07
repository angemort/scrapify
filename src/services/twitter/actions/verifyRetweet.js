const { logToFile } = require('../../../utils/logger');

async function verifyRetweet(context, page, platformUrl, userTarget) { 
    try {
        logToFile(`Vérification du retweet pour l'utilisateur ${userTarget}`);

        // Extraire l'ID du tweet cible et le nom de l'utilisateur
        const idTweetTarget = platformUrl.split('/').pop();
        const userRequest = platformUrl.replace('https://x.com/', '').split('/')[0];
        let idUserTarget;
        let isRetweetFound = false;
        let dateRetweet;

        // Intercepter une seule fois pour éviter les reconfigurations
        await context.route('**/TweetDetail*', async route => {
            const request = route.request();
            if (request.method() === 'GET') {
                route.continue();
                const response = await request.response();

                if (response.url().includes('TweetDetail')) {
                    try {
                        const jsonResponse = await response.json();
                        logToFile(`Analyse TweetDetail...`);

                        // Extraire l'ID de l'utilisateur depuis les détails du tweet
                        const tweetResult = jsonResponse.data.threaded_conversation_with_injections_v2.instructions[0].entries[0].content.itemContent.tweet_results.result;
                        if (tweetResult.core.user_results.result.legacy.screen_name === userRequest) {
                            idUserTarget = tweetResult.core.user_results.result.rest_id;
                            logToFile(`Found User: ${tweetResult.core.user_results.result.legacy.screen_name} (${idUserTarget})`);
                        } else {
                            logToFile(`User not found: ${userRequest}`);
                        }
                    } catch (error) {
                        logToFile(`Erreur lors de l'analyse de la réponse JSON: ${error.message}`);
                    }
                }
            } else {
                route.continue();
            }
        });

        // Charger la page du tweet pour lancer la première interception
        await page.goto(platformUrl, { waitUntil: 'domcontentloaded' });

        // Si l'ID utilisateur n'est pas trouvé, arrêter la vérification ici
        if (!idUserTarget) {
            logToFile(`ID de l'utilisateur introuvable pour ${userTarget}`);
            return false;
        }

        // Intercepter les tweets du profil utilisateur pour vérifier le retweet cible
        await context.route('**/UserTweets*', async route => {
            const request = route.request();
            if (request.method() === 'GET') {
                route.continue();
                const response = await request.response();

                if (response.url().includes('UserTweets')) {
                    try {
                        const jsonResponse = await response.json();
                        logToFile('Analyse des tweets...');

                        // Récupérer et filtrer les retweets
                        const tweets = jsonResponse.data.user.result.timeline_v2.timeline.instructions
                            .flatMap(instruction => instruction.entries || [])
                            .map(entry => entry.content?.itemContent?.tweet_results?.result)
                            .filter(tweet => tweet?.legacy?.retweeted_status_result);

                        // Vérifier la présence du retweet
                        isRetweetFound = tweets.some(tweet => 
                            tweet.legacy.retweeted_status_result.result.core.user_results.result.rest_id === idUserTarget &&
                            tweet.legacy.retweeted_status_result.result.legacy.conversation_id_str === idTweetTarget
                        );
                        dateRetweet = tweets.find(tweet => 
                            tweet.legacy.retweeted_status_result.result.core.user_results.result.rest_id === idUserTarget &&
                            tweet.legacy.retweeted_status_result.result.legacy.conversation_id_str === idTweetTarget
                        )?.legacy.retweeted_status_result.result.legacy.created_at;

                        if (isRetweetFound) {
                            logToFile(`Retweet trouvé pour l'utilisateur ${userTarget}`);
                        } else {
                            logToFile(`Aucun retweet trouvé pour l'utilisateur ${userTarget}`);
                        }
                    } catch (error) {
                        logToFile(`Erreur lors de l'analyse de la réponse JSON: ${error.message}`);
                    }
                }
            } else {
                route.continue();
            }
        });

        // Charger la page de profil de l'utilisateur pour déclencher l'interception de `UserTweets`
        const userProfileUrl = `https://x.com/${userTarget.replace('@', '')}`;
        await page.goto(userProfileUrl, { waitUntil: 'domcontentloaded' });

        return { has_retweeted: isRetweetFound, retweet_date: dateRetweet };
    } catch (error) {
        console.error('Erreur lors de la vérification du retweet :', error);
        return {
            has_retweeted: false,
            retweet_date: null
        };
    }
}

module.exports = { verifyRetweet };