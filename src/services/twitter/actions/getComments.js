const { logToFile } = require('../../../utils/logger');
const { mediaSegment } = require('../segments/media');
const { metricsSegment } = require('../segments/metrics');
const { userSegment } = require('../segments/user');

// Fonction principale pour intercepter et obtenir les commentaires récents avec le tri par Recency
async function interceptAndRetrieveComments(context, page, platformUrl) {
    let comments = [];

    await context.route('**/TweetDetail*', async route => {
        const request = route.request();
        let url = new URL(request.url());

        // Modifier la requête pour trier par ordre récent
        let variables = JSON.parse(decodeURIComponent(url.searchParams.get('variables')));
        variables.rankingMode = "Recency";
        const encodedVariables = JSON.stringify(variables);
        url.searchParams.set('variables', encodedVariables);
        
        route.continue({ url: url.toString() });

        logToFile(`Modified request: ${JSON.stringify(variables)} ${url.toString()}`);

        // Intercepter la réponse réseau et extraire les commentaires
        const response = await request.response();
        if (response && response.url().includes('TweetDetail')) {
            try {
                const jsonResponse = await response.json();
                logToFile('Analyzing recent comments...');

                if (!jsonResponse.data || !jsonResponse.data.threaded_conversation_with_injections_v2) {
                    logToFile("The 'threaded_conversation_with_injections_v2' key is missing from the JSON response.");
                    return [];
                }

                const entries = jsonResponse.data.threaded_conversation_with_injections_v2.instructions[0].entries;

                // Parcourir les entrées pour récupérer les commentaires
                for (const entry of entries) {
                    if (entry.content && entry.content.items && entry.content.entryType === "TimelineTimelineModule") {
                        const commentsData = entry.content.items;
                        
                        for (const commentData of commentsData) {
                            const tweetData = commentData.item.itemContent.tweet_results?.result;
                            if(tweetData?.__typename === "Tweet" && tweetData.core && tweetData.legacy) {

                                const user = userSegment(tweetData);
                                // Médias du tweet
                                const medias = mediaSegment(tweetData);

                                const comment = {
                                    id: tweetData.rest_id,
                                    content: tweetData.legacy.full_text,
                                    media: medias || [],
                                    created_at: tweetData.legacy.created_at,
                                    metrics: metricsSegment(tweetData),
                                    replies: []
                                };

                                const isReply = tweetData.legacy.in_reply_to_screen_name !== null;

                                if (isReply) {
                                    const parentUsername = tweetData.legacy.in_reply_to_screen_name;
                                    
                                    // Trouver le commentaire parent dans la liste des commentaires
                                    const parentComment = comments.find(c => c.user.username === parentUsername);
                                    
                                    if (parentComment) {
                                        // Ajouter en tant que réponse au commentaire parent
                                        parentComment.comment.replies.push({
                                            user,
                                            comment
                                        });
                                    } else {
                                        // Si le parent n'est pas trouvé, l'ajouter comme commentaire principal
                                        comments.push({
                                            user,
                                            comment
                                        });
                                    }
                                } else {
                                    // Ajouter le commentaire principal s'il n'est pas une réponse
                                    comments.push({
                                        user,
                                        comment
                                    });
                                }
                            }
                        }
                    }
                }

                logToFile(`Extracted recent comments: ${JSON.stringify(comments)}`);
            } catch (error) {
                logToFile(`Error during JSON response analysis: ${error.message}`);
                throw error;
            }
        }
    });

    // Charger la page du tweet pour déclencher la requête
    await page.goto(platformUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.close();

    return {
        comments_count: comments.length,
        comments: comments
    };
}

// Fonction pour obtenir uniquement les commentaires d'un utilisateur cible (userTarget) dans l'ordre récent
async function getUserComments(context, page, platformUrl, userTarget) {
    try {
        const targetUser = userTarget.startsWith('@') ? userTarget.slice(1) : userTarget;
        const comments = await interceptAndRetrieveComments(context, page, platformUrl);
        const userComments = comments.filter(comment => comment.user.username === targetUser);
        logToFile(`Recent comments from ${userTarget}: ${JSON.stringify(userComments)}`);
        return {
            has_commented: userComments.length > 0,
            comments_count: userComments.length,
            comments: userComments
        };
    } catch (error) {
        logToFile(`Error during user comments extraction: ${error.message}`);
        throw error;
    }
}

// Fonction pour obtenir tous les commentaires récents sans filtrage par utilisateur
async function getRecentComments(context, page, platformUrl) {
    try {
        const comments = await interceptAndRetrieveComments(context, page, platformUrl);
        logToFile(`All recent comments: ${JSON.stringify(comments)}`);
        return comments;
    } catch (error) {
        logToFile(`Error during recent comments extraction: ${error.message}`);
        throw error;
    }
}

module.exports = { getUserComments, getRecentComments };