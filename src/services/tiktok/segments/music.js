/**
 * @interface MusicInfo
 * @description Informations sur la musique d'un post.
 * @summary Informations sur la musique d'un post.
 * @memberof module:TikTokService
 */

/**
 * @typedef {Object} MusicPostInfo
 * @memberof module:TikTokService
 * @property {string} id - Identifiant de la musique.
 * @property {string} title - Titre de la musique.
 * @property {string} album - Nom de l'album.
 * @property {string} authorName - Nom de l'auteur.
 * @property {string} coverThumb - URL de la couverture de la musique.
 * @property {int} duration - Durée de la musique.
 * @property {string} playUrl - URL de la musique.
 */

const musicSegment = (musicData) => {
    return {
        album: musicData.album,
        title: musicData.title,
        authorName: musicData.authorName,
        coverThumb: musicData.coverThumb,
        duration: Number(musicData.duration) || 0,
        id: musicData.id,
        playUrl: musicData.playUrl
    };
};

module.exports = { musicSegment };