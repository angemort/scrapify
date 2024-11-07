/**
 * @interface MetricsInfo
 * @description Informations sur les métriques d'un post Tiktok.
 * @summary Informations sur les métriques d'un post Tiktok.
 * @memberof module:TikTokService
 */

/**
 * @typedef {Object} MetricsPostInfo
 * @memberof module:TikTokService
 * @property {number} collect_count - Nombre de collections.
 * @property {number} comment_count - Nombre de commentaires.
 * @property {number} digg_count - Nombre de likes.
 * @property {number} play_count - Nombre de vues.
 * @property {number} share_count - Nombre de partages.
 */

/**
 * @typedef {Object} MetricsProfileInfo
 * @memberof module:TikTokService
 * @property {number} follower_count - Nombre de followers.
 * @property {number} following_count - Nombre de follows.
 * @property {number} heart_count - Nombre de coeurs.
 * @property {number} video_count - Nombre de vidéos.
 * @property {number} friend_count - Nombre de contacts.
 */

const metricsSegment = (data, type = 'post') => {
    if (type === 'post') {
        return {
            collect_count: Number(data.collectCount) || 0,
            comment_count: Number(data.commentCount) || 0,
            digg_count: Number(data.diggCount) || 0,
            play_count: Number(data.playCount) || 0,
            share_count: Number(data.shareCount) || 0,
        };
    } else {
        return {
            follower_count: Number(data.followerCount) || 0,
            following_count: Number(data.followingCount) || 0,
            heart_count: Number(data.heart) || 0,
            video_count: Number(data.videoCount) || 0,
            friend_count: Number(data.friendCount) || 0
        };
    }
};

module.exports = { metricsSegment };