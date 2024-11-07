function validateRequest(req, res, next) {
    const { platform, action, url, userTarget } = req.body;
  
    if (!platform || !action) {
      return res.status(400).json({
        success: false,
        error: 'Les paramètres "platform" et "action" sont requis.',
      });
    }
  
    // Définir les paramètres requis en fonction de l'action
    const actionRequirements = {
      verifyRetweet: ['url', 'userTarget'],
      checkUserComment: ['url', 'userTarget'],
      getMetrics: ['url'],
      getRecentComments: ['url'],
      getProfileMetrics: ['url'],
    };

    // Définir les fonctions possibles pour chaque platform
    const platformRequirements = {
        verifyRetweet: ['twitter'],
        checkUserComment: ['twitter'],
        getMetrics: ['tiktok', 'twitter'],
        getRecentComments: ['twitter'],
        getProfileMetrics: ['tiktok', 'twitter'],
    };

    // Vérifier si l'action est autorisée pour la plateforme spécifiée
    const allowedPlatforms = platformRequirements[action];
    if (!allowedPlatforms || !allowedPlatforms.includes(platform)) {
        return res.status(400).json({
            success: false,
            error: `L'action "${action}" n'est pas supportée pour la plateforme "${platform}".`,
        });
    }
  
    const requiredParams = actionRequirements[action];
  
    if (!requiredParams) {
      return res.status(400).json({
        success: false,
        error: `Action non supportée: ${action}`,
      });
    }
  
    // Vérifier que les paramètres requis sont présents
    for (const param of requiredParams) {
      if (!req.body[param]) {
        return res.status(400).json({
          success: false,
          error: `Le paramètre "${param}" est requis pour l'action "${action}".`,
        });
      }
    }
  
    next();
}

module.exports = { validateRequest };