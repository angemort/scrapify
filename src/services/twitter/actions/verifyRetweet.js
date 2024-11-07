const { logToFile } = require('../../../utils/logger');

async function verifyRetweet(context, page, platformUrl, userTarget) { 
    try {
        logToFile(`Verifying retweet for user ${userTarget}`);

        // Extract the tweet ID and user name
        const idTweetTarget = platformUrl.split('/').pop();
        const userRequest = platformUrl.replace('https://x.com/', '').split('/')[0];
        let idUserTarget;
        let isRetweetFound = false;
        let dateRetweet;

        // Intercept once to avoid reconfigurations
        await context.route('**/TweetDetail*', async route => {
            const request = route.request();
            if (request.method() === 'GET') {
                route.continue();
                const response = await request.response();

                if (response.url().includes('TweetDetail')) {
                    try {
                        const jsonResponse = await response.json();
                        logToFile(`Analyse TweetDetail...`);

                        // Extract the user ID from the tweet details
                        const tweetResult = jsonResponse.data.threaded_conversation_with_injections_v2.instructions[0].entries[0].content.itemContent.tweet_results.result;
                        if (tweetResult.core.user_results.result.legacy.screen_name === userRequest) {
                            idUserTarget = tweetResult.core.user_results.result.rest_id;
                            logToFile(`Found User: ${tweetResult.core.user_results.result.legacy.screen_name} (${idUserTarget})`);
                        } else {
                            logToFile(`User not found: ${userRequest}`);
                        }
                    } catch (error) {
                        logToFile(`Error during JSON response analysis: ${error.message}`);
                        throw error;
                    }
                }
            } else {
                route.continue();
            }
        });

        // Load the tweet page to trigger the first interception
        await page.goto(platformUrl, { waitUntil: 'domcontentloaded' });

        // If the user ID is not found, stop the verification here
        if (!idUserTarget) {
            logToFile(`User ID not found for ${userTarget}`);
            return false;
        }

        // Intercept the user tweets to verify the target retweet
        await context.route('**/UserTweets*', async route => {
            const request = route.request();
            if (request.method() === 'GET') {
                route.continue();
                const response = await request.response();

                if (response.url().includes('UserTweets')) {
                    try {
                        const jsonResponse = await response.json();
                        logToFile('Analyse tweets...');

                        // Retrieve and filter retweets
                        const tweets = jsonResponse.data.user.result.timeline_v2.timeline.instructions
                            .flatMap(instruction => instruction.entries || [])
                            .map(entry => entry.content?.itemContent?.tweet_results?.result)
                            .filter(tweet => tweet?.legacy?.retweeted_status_result);

                        // Verify the presence of the retweet
                        isRetweetFound = tweets.some(tweet => 
                            tweet.legacy.retweeted_status_result.result.core.user_results.result.rest_id === idUserTarget &&
                            tweet.legacy.retweeted_status_result.result.legacy.conversation_id_str === idTweetTarget
                        );
                        dateRetweet = tweets.find(tweet => 
                            tweet.legacy.retweeted_status_result.result.core.user_results.result.rest_id === idUserTarget &&
                            tweet.legacy.retweeted_status_result.result.legacy.conversation_id_str === idTweetTarget
                        )?.legacy.retweeted_status_result.result.legacy.created_at;

                        if (isRetweetFound) {
                            logToFile(`Retweet found for user ${userTarget}`);
                        } else {
                            logToFile(`No retweet found for user ${userTarget}`);
                        }
                    } catch (error) {
                        logToFile(`Error during JSON response analysis: ${error.message}`);
                        throw error;
                    }
                }
            } else {
                route.continue();
            }
        });

        // Load the user profile page to trigger the `UserTweets` interception
        const userProfileUrl = `https://x.com/${userTarget.replace('@', '')}`;
        await page.goto(userProfileUrl, { waitUntil: 'domcontentloaded' });

        return { has_retweeted: isRetweetFound, retweet_date: dateRetweet };
    } catch (error) {
        logToFile(`Error during retweet verification: ${error.message}`);
        throw error;
    }
}

module.exports = { verifyRetweet };