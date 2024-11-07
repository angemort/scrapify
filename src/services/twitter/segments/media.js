

/**
 * @interface MediaInfo
 * @description Informations sur le média d'un tweet.
 * @summary Informations sur le média d'un tweet.
 * @memberof module:TwitterService
 */

/**
 * @typedef {Object} MediaInfo
 * @memberof module:TwitterService
 * @property {string} type - Type de média.
 * @property {string} url - URL du média.
 * @property {string} alt - URL alternative du média.
 * @property {Object} sizes - Taille du média.
 * @property {string} id - Identifiant du média.
 * 
 * @property {VideoInfo} video_info - Informations supplémentaires pour les vidéos.
 */

/**
 * @interface VideoInfo
 * @description Informations supplémentaires pour les vidéos.
 * @summary Informations supplémentaires pour les vidéos.
 * @memberof module:TwitterService
 */

/**
 * @typedef {Object} VideoInfo
 * @memberof module:TwitterService
 * @property {Object[]} variants - Variants de la vidéo.
 * @property {string} url - URL de la vidéo.
 * @property {number} bitrate - Bitrate de la vidéo.
 * @property {string} content_type - Type de contenu de la vidéo.
 */

const mediaSegment = (tweetData) => (
    tweetData.legacy.extended_entities?.media 
    || tweetData.legacy.entities?.media 
    || []).map(media => {
    const mediaData = {
        type: media.type,
        url: media.media_url_https,
        alt: media.display_url,
        sizes: media.sizes,
        id: media.id_str
    };

    // Détails pour les vidéos
    if (media.type === 'video' || media.type === 'animated_gif') {
        mediaData.video_info = media.video_info?.variants.map(variant => ({
            url: variant.url,
            bitrate: variant.bitrate || 'N/A',
            content_type: variant.content_type
        }));
    }
    return mediaData;
});

module.exports = { mediaSegment };