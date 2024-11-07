/**
 * @interface AuthorInfo
 * @description Informations sur l'auteur d'un post Tiktok.
 * @summary Informations sur l'auteur d'un post Tiktok.
 * @memberof module:TikTokService
 */

/**
 * @typedef {Object} AuthorPostInfo
 * @memberof module:TikTokService
 * @property {string} uid - ID de l'auteur.
 * @property {string} nickname - Nom de l'auteur.
 * @property {string} uniqueId - Identifiant unique de l'auteur.
 * @property {boolean} verified - Indique si l'auteur est vérifié.
 * @property {string} avatarThumb - URL de l'avatar de l'auteur.
 * @property {string} signature - Signature de l'auteur.
 */

/**
 * @typedef {Object} AuthorProfileInfo
 * @memberof module:TikTokService
 * @property {string} uid - ID de l'auteur.
 * @property {string} nickname - Nom de l'auteur.
 * @property {string} uniqueId - Identifiant unique de l'auteur.
 * @property {boolean} verified - Indique si l'auteur est vérifié.
 * @property {string} avatarThumb - URL de l'avatar de l'auteur.
 * @property {string} signature - Signature de l'auteur.
 * @property {string} bioLink - URL de la bio de l'auteur.
 * @property {string} region - Région de l'auteur.
 * @property {string} language - Langue de l'auteur.
 */

const authorSegment = (authorData) => {
    return {
        uid: authorData.uid || authorData.id,
        nickname: authorData.nickname,
        uniqueId: authorData.uniqueId,
        verified: authorData.verified || false,
        avatarThumb: authorData.avatarThumb || '',
        signature: authorData.signature || '',
        
        bioLink: authorData?.bioLink || undefined,
        region: authorData?.region || undefined,
        language: authorData?.language || undefined
    };
};

module.exports = { authorSegment };