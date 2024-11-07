const { logToFile } = require('../../../utils/logger');

module.exports = {
    detectAction: async (url) => {
        if (url.includes('/video/')) {
            return 'post';
        } else if (url.match(/https:\/\/www\.tiktok\.com\/[^\/]+$/)) {
            return 'profile';
        }
        throw new Error('Unsupported URL format. Please provide a valid Tiktok post or profile URL.');
    }
};