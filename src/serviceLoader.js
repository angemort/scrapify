const fs = require('fs').promises;
const path = require('path');

class ServiceLoader {
    constructor() {
        this.services = new Map();
    }

    async loadServices() {
        try {
            const servicesPath = path.join(__dirname, './services');
            const directories = await fs.readdir(servicesPath);

            for (const dir of directories) {
                const servicePath = path.join(servicesPath, dir);
                const stat = await fs.stat(servicePath);

                if (stat.isDirectory()) {
                    try {
                        const service = require(path.join(servicePath, 'service.js'));
                        this.services.set(dir, service);
                        console.log(`Service ${dir} chargé avec succès`);
                    } catch (error) {
                        console.error(`Erreur lors du chargement du service ${dir}:`, error);
                    }
                }
            }
        } catch (error) {
            console.error('Erreur lors du chargement des services:', error);
        }
    }

    getService(platform) {
        return this.services.get(platform);
    }

    getAvailablePlatforms() {
        return Array.from(this.services.keys());
    }
}

module.exports = new ServiceLoader(); 