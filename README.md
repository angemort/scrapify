# 🤖 Scraping Social API

API de scraping pour les réseaux sociaux permettant de récupérer et vérifier des informations depuis Twitter et TikTok.

## 📋 Fonctionnalités

- Scraping synchrone via REST API
- Scraping asynchrone via WebSocket
- Support de Twitter et TikTok
- Rate limiting intégré
- Logging des opérations
- Validation des données

## 🚀 Installation

```bash
# Cloner le repository
git clone https://github.com/AngeMort/scrapping-sociaux.git

# Installer les dépendances
cd scrapping-sociaux
npm install
```

## ⚙️ Configuration

Créez un fichier `.env` à la racine du projet :

```env
PORT=3000
ALLOWED_ORIGINS=http://localhost:8080

# Twitter
TWITTER_EMAIL01=example@example.com
TWITTER_USERNAME01=username
TWITTER_PASSWORD01=password
TWITTER_EMAIL02=example@example.com
TWITTER_USERNAME02=username
TWITTER_PASSWORD02=password
TWITTER_EMAIL03=example@example.com
TWITTER_USERNAME03=username
TWITTER_PASSWORD03=password
```

## 🔧 Utilisation

### Démarrer le serveur

```bash
# Démarrer le serveur
npm run start (ou node server.js)
```

### Exemple générateur de documentation

```bash
# Générer la documentation
npm run doc (ou jsdoc -c jsdoc.json)
```

### Exemple d'utilisation REST API

```javascript
const response = await fetch('http://localhost:3000/scrape', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        url: 'https://twitter.com/username/status/123456789',
        userTarget: 'username',
        platform: 'twitter',
        action: 'getMetrics'
    })
});
```

### Exemple d'utilisation WebSocket

```javascript
const socket = new WebSocket('ws://localhost:3000');

socket.emit('get-scraping', {
  url: 'https://twitter.com/username/status/123456789',
  userTarget: 'username',
  platform: 'twitter',
  action: 'getMetrics'
});
```

## 📚 Documentation API
Cette API vous permet d'exécuter différentes actions de scraping sur des plateformes telles que Twitter et TikTok.

## Endpoint `/scrape`

Le endpoint `/scrape` permet d'exécuter une action de scraping sur une plateforme donnée.

### **Méthode HTTP**
- **GET**

### **Paramètres**

- **`url`** *(string, obligatoire)* : L'URL du profil ou du post ciblé.
- **`platform`** *(string, obligatoire)* : La plateforme cible. Valeurs possibles :
  - `twitter`
  - `tiktok`
  - *(ajoutez d'autres plateformes si disponibles)*
- **`action`** *(string, obligatoire)* : L'action du service à exécuter. Actions possibles :
  - `getMetrics`
  - `verifyRetweet`
  - `checkUserComment`
  - *(ajoutez d'autres actions si disponibles)*
- **`userTarget`** *(string, optionnel)* : Le nom d'utilisateur ciblé, requis pour certaines actions.

### **Exemples d'utilisation**

#### **Exemple 1 : Récupérer les informations d'un post ou d'un profil Twitter (action getMetrics)**
- URL : https://x.com/user/status/1234567890 (adresse de la page du post)
- ou URL : https://x.com/username (adresse de la page du profil)
```http
GET /scrape?platform=twitter&action=getMetrics&url=https://x.com/user/status/1234567890
```

#### **Exemple 2 : Vérifier un retweet sur Twitter (action verifyRetweet)**
- URL : https://x.com/user/status/1234567890 (adresse de la page du post)
- UserTarget : @KnightsonBase (l'utilisateur ciblé)

```http
GET /scrape?platform=twitter&action=verifyRetweet&url=https://x.com/user/status/1234567890&userTarget=@KnightsonBase
```

#### **Exemple 3 : Vérifier si un utilisateur a commenté un post Twitter (action checkUserComment)**
- URL : https://x.com/user/status/1234567890 (adresse de la page du post)
- UserTarget : @KnightsonBase (l'utilisateur ciblé)

```http
GET /scrape?platform=twitter&action=checkUserComment&url=https://x.com/user/status/1234567890&userTarget=@KnightsonBase
```

## 🛠️ Technologies utilisées

- Node.js
- Express.js
- Socket.IO
- Joi (validation)
- Winston (logging)
- JSDoc (documentation)

## 🔒 Limitations

- Rate limit : 10 requêtes/minute/IP
- Taille max username : 50 caractères
- Plateformes supportées : Twitter, LinkedIn

## 🤝 Contribution

1. Fork le projet
2. Créez votre branche (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add: Amazing Feature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📝 License

Ce projet est sous licence MIT - voir le fichier [LICENSE.md](LICENSE.md) pour plus de détails.

## ✨ Auteurs

- **Ange Mort** - *Travail initial* - [Ange Mort](https://github.com/AngeMort)

## 📮 Contact

- Email : angemort@protonmail.com
- Twitter : [@AngeM0rt](https://twitter.com/AngeM0rt)
- Discord : Ange Mort