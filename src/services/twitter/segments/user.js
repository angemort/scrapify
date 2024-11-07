/**
 * @interface UserInfo
 * @description Informations sur l'utilisateur d'un tweet.
 * @summary Informations sur l'utilisateur d'un tweet.
 * @memberof module:TwitterService
 */

/**
 * @typedef {Object} UserInfo
 * @memberof module:TwitterService
 * @property {string} id - Identifiant de l'utilisateur.
 * @property {string} name - Nom complet de l'utilisateur.
 * @property {string} username - Nom d'utilisateur (handle).
 * @property {boolean} certified - Indique si l'utilisateur est certifié.
 * @property {string} avatar - URL de l'image de profil.
 * @property {number} followers_count - Nombre de followers.
 * @property {number} friends_count - Nombre d'amis.
 */
const userSegment = (tweetData) => {
    return {
        id: tweetData.core.user_results.result.rest_id,
        name: tweetData.core.user_results.result.legacy.name,
        username: tweetData.core.user_results.result.legacy.screen_name,
        certified: tweetData.core.user_results.result.is_blue_verified,
        avatar: tweetData.core.user_results.result.legacy.profile_image_url_https,
        followers_count: Number(tweetData.core.user_results.result.legacy.followers_count) || 0,
        friends_count: Number(tweetData.core.user_results.result.legacy.friends_count) || 0
    }
}

module.exports = { userSegment };