/**
 * @interface VideoPostInfo
 * @description Informations sur la vidéo d'un post.
 * @summary Informations sur la vidéo d'un post.
 * @memberof module:TikTokService
 */

/** 
 * @typedef {Object} VideoPostInfo
 * @memberof module:TikTokService
 * @property {string} VQScore - Score de qualité vidéo.
 * @property {string} languageCode - Code de la langue.
 * @property {string} cover - URL de la couverture de la vidéo.
 * @property {string} definition - Définition de la vidéo.
 * @property {int} duration - Durée de la vidéo.
 * @property {string} format - Format de la vidéo.
 * @property {string} playAddr - URL de la vidéo.
 */

const videoSegment = (videoData) => {
    return {
        VQScore: videoData.VQScore,
        languageCode: videoData.claInfo?.originalLanguageInfo?.languageCode || '',
        cover: videoData.cover,
        definition: videoData.definition,
        duration: Number(videoData.duration) || 0,
        format: videoData.format,
        playAddr: videoData.playAddr
    };
};

module.exports = { videoSegment };