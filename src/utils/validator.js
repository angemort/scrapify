function validateRequest(req, res, next) {
  const { platform, action, url, userTarget } = req.body;
  const validationResult = validateData({ platform, action, url, userTarget });
  
  if (!validationResult.success) {
    return res.status(400).json(validationResult);
  }

  next();
}

function validateWebSocketData(data) {
  const { platform, action, url, userTarget } = data;
  const validationResult = validateData({ platform, action, url, userTarget });
  
  if (!validationResult.success) {
    throw new Error(validationResult.error);
  }
}

function validateData({ platform, action, url, userTarget }) {
  if (!platform || !action) {
    return { success: false, error: 'Les paramètres "platform" et "action" sont requis.' };
  }

  const actionRequirements = {
    verifyRetweet: ['url', 'userTarget'],
    checkUserComment: ['url', 'userTarget'],
    getMetrics: ['url'],
    getRecentComments: ['url'],
    getProfileMetrics: ['url'],
  };

  const platformRequirements = {
    verifyRetweet: ['twitter'],
    checkUserComment: ['twitter'],
    getMetrics: ['tiktok', 'twitter'],
    getRecentComments: ['twitter'],
    getProfileMetrics: ['tiktok', 'twitter'],
  };

  const allowedPlatforms = platformRequirements[action];
  if (!allowedPlatforms || !allowedPlatforms.includes(platform)) {
    return {
      success: false,
      error: `L'action "${action}" n'est pas supportée pour la plateforme "${platform}".`,
    };
  }

  const requiredParams = actionRequirements[action];
  if (!requiredParams) {
    return { success: false, error: `Action non supportée: ${action}` };
  }

  for (const param of requiredParams) {
    if (!eval(param)) {  // Utilisez `eval` pour accéder directement aux variables dans le contexte
      return { success: false, error: `Le paramètre "${param}" est requis pour l'action "${action}".` };
    }
  }

  return { success: true };
}

module.exports = { validateRequest, validateWebSocketData };