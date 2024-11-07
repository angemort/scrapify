const { logToFile } = require('../../../utils/logger');

const urlTwitter = 'https://x.com/';
const debugScreenshotPath = './logs/debug-screenshot.png';

// Login to Twitter
const twitterAccounts = [
    { email: process.env.TWITTER_EMAIL01, username: process.env.TWITTER_USERNAME01, password: process.env.TWITTER_PASSWORD01 },
    { email: process.env.TWITTER_EMAIL02, username: process.env.TWITTER_USERNAME02, password: process.env.TWITTER_PASSWORD02 },
    { email: process.env.TWITTER_EMAIL03, username: process.env.TWITTER_USERNAME03, password: process.env.TWITTER_PASSWORD03 },
];
// Rotation accounts Twitter
let account = twitterAccounts[Math.floor(Math.random() * twitterAccounts.length)];

module.exports = {
    loginToTwitter: async (page) => {
        try {
            logToFile('Démarrage de la connexion sur Twitter...');
            await page.goto(urlTwitter, { waitUntil: 'networkidle' });
            logToFile('Page de connexion Twitter chargée.');

            // Ouvrir le modal de connexion
            await page.click('a[data-testid="loginButton"]');
            logToFile('Modal de connexion ouvert.');

            // Attendre l'input pour le nom d'utilisateur et saisir le nom
            await page.waitForSelector('//input[contains(@autocomplete, "username")]', { timeout: 10000 });
            await page.type('//input[contains(@autocomplete, "username")]', account.email);
            logToFile('Nom d\'utilisateur saisi -> press Enter');
            await page.keyboard.press('Enter');

            // Gérer la vérification bot/progress bar
            try {
                logToFile('Attente de la disparition de la progress bar...');
                await page.waitForSelector('div[role="progressbar"]', { state: 'detached', timeout: 15000 });

                logToFile('Vérification de l\'iframe de protection...');
                const frameHandle = await page.waitForSelector('iframe[id="arkoseFrame"]', { timeout: 15000 });
                const frame = await frameHandle.contentFrame();

                if (frame) {
                    logToFile('Contexte basculé vers l\'iframe.');
                    await frame.waitForSelector('button[data-theme="home.verifyButton"]', { timeout: 10000 });
                    logToFile('Cliquer sur le bouton "Authenticate"...');
                    await frame.click('button[data-theme="home.verifyButton"]');
                }
            } catch (iframeError) {
                logToFile('Aucune étape de vérification via iframe requise ou échec de la vérification : ' + iframeError);
            }

            // Vérification de l'étape supplémentaire du username
            try {
                await page.waitForSelector('input[data-testid="ocfEnterTextTextInput"]', { timeout: 10000 });
                logToFile('Étape de vérification supplémentaire détectée...');
                await page.type('input[data-testid="ocfEnterTextTextInput"]', account.username);
                await page.keyboard.press('Enter');
            } catch (usernameError) {
                logToFile('Aucune étape de vérification supplémentaire pour le nom d\'utilisateur : ' + usernameError);
            }

            // Attente et saisie du mot de passe
            await page.waitForSelector('input[name="password"]', { timeout: 10000 });
            await page.type('input[name="password"]', account.password);
            logToFile('Mot de passe saisi.');
            await page.keyboard.press('Enter');
            logToFile('Connexion réussie.');
        } catch (error) {
            logToFile(`Erreur de connexion : ${error}`);
            // DEBUG screenshot
            await page.screenshot({ path: debugScreenshotPath });
            throw error;
        }
    },
    initializeTwitterSession: async (context, page) => {
        logToFile('Vérification de la connexion Twitter...');
        await page.goto(urlTwitter, { waitUntil: 'domcontentloaded' });
        const isLoggedIn = await page.$('button[type="button"][data-testid="SideNav_AccountSwitcher_Button"]') !== null;
        if (!isLoggedIn) {
            await context.clearCookies();
            logToFile('Cookies supprimés car l\'utilisateur n\'était pas connecté.');
            await loginToTwitter(page, 'twitter');
        } else {
            logToFile('Session déjà active.');
        }
        return isLoggedIn;
    },
    detectAction: async (url) => {
        if (url.includes('/status/')) {
            return 'post';
        } else if (url.match(/https:\/\/x\.com\/[^\/]+$/)) {
            return 'profile';
        }
        throw new Error('Unsupported URL format. Please provide a valid Twitter post or profile URL.');
    }
};