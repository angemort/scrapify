/**
 * @interface MetricsInfo
 * @description Informations sur les métriques d'un tweet.
 * @summary Informations sur les métriques d'un tweet.
 * @memberof module:TwitterService
 */

/**
 * @typedef {Object} MetricsInfo
 * @memberof module:TwitterService
 * @property {number} replies - Nombre de réponses.
 * @property {number} likes - Nombre de likes.
 * @property {number} retweets - Nombre de retweets.
 * @property {number} quotes - Nombre de quotes.
 * @property {number} bookmarks - Nombre de bookmarks.
 * @property {number} views - Nombre de vues.
 */

const metricsSegment = (tweetData) => {
    return {
        replies: Number(tweetData.legacy.reply_count) || 0,
        likes: Number(tweetData.legacy.favorite_count) || 0,
        retweets: Number(tweetData.legacy.retweet_count) || 0,
        quotes: Number(tweetData.legacy?.quote_count) || undefined,
        bookmarks: Number(tweetData.legacy?.bookmark_count) || undefined,
        views: Number(tweetData.views?.count) || 0,
    }
}

module.exports = { metricsSegment };