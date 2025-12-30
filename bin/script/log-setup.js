const fs = require('fs');
const path = require('path');
const { configs } = require('../configs/app.config');

class LogSetup {

    async initialize() {
        console.log('🔧 Initialisation du système de logs...\n');

        await this.createDirectories();
        await this.checkDependencies();
        await this.createConfigFile();
        await this.setupLogrotation();

        console.log('✅ Configuration du système de logs terminée!');
        console.log('\nProchaines étapes:');
        console.log('1. Vérifiez les variables d\'environnement dans .env');
        console.log('2. Redémarrez votre application');
        console.log('3. Testez les endpoints de logs: GET /admin/logs');
        console.log('4. Configurez le monitoring avec le dashboard');
    }

    async createDirectories() {
        console.log('📁 Création des répertoires...');

        const directories = [
            '.logs',
            '.logs/archives',
            'scripts',
            'docs/api'
        ];

        for (const dir of directories) {
            const fullPath = path.join(process.cwd(), dir);
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
                console.log(`   ✓ ${dir}/`);
            } else {
                console.log(`   - ${dir}/ (existe déjà)`);
            }
        }
    }

    async checkDependencies() {
        console.log('\n📦 Vérification des dépendances...');

        const requiredPackages = {
            'morgan': 'Logging HTTP',
            'ioredis': 'Cache Redis (optionnel)',
            'express-rate-limit': 'Rate limiting',
            'rate-limit-redis': 'Rate limiting avec Redis'
        };

        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

        for (const [pkg, description] of Object.entries(requiredPackages)) {
            if (dependencies[pkg]) {
                console.log(`   ✓ ${pkg} - ${description}`);
            } else {
                console.log(`   ⚠️  ${pkg} - ${description} (manquant)`);
            }
        }

        // Packages optionnels recommandés
        const optionalPackages = {
            'node-cron': 'Tâches programmées',
            'joi': 'Validation des données',
            'helmet': 'Sécurité HTTP'
        };

        console.log('\n   Packages optionnels recommandés:');
        for (const [pkg, description] of Object.entries(optionalPackages)) {
            const status = dependencies[pkg] ? '✓' : '○';
            console.log(`   ${status} ${pkg} - ${description}`);
        }
    }

    async createConfigFile() {
        console.log('\n⚙️ Génération du fichier de configuration...');

        const configTemplate = `# Configuration du système de logs

# Activation du logging
LOGGING_ENABLED=true
LOGGING_TO_FILE=true
LOGGING_TO_DATABASE=true

# Configuration de la queue
MAX_LOG_QUEUE_SIZE=1000
LOG_BATCH_SIZE=10
LOG_PROCESS_INTERVAL=5000

# Rétention des logs
LOG_RETENTION_ENABLED=true
LOG_RETENTION_DAILY=7
LOG_RETENTION_WEEKLY=4  
LOG_RETENTION_MONTHLY=12

# Base de données
DB_RETENTION_CRITICAL=365
DB_RETENTION_ERRORS=90
DB_RETENTION_NORMAL=30

# Compression et archives
LOG_COMPRESS_ARCHIVES=false
LOG_RETENTION_SCHEDULE="0 2 * * *"

# Sécurité
LOG_SENSITIVE_FIELDS=password,token,secret,key,authorization
MAX_REQUEST_SIZE=10mb

# Performance
LOG_SKIP_PATHS=/health,/status,/favicon.ico
LOG_SKIP_IPS=127.0.0.1,::1
`;

        const envPath = path.join(process.cwd(), '.env.logs');
        if (!fs.existsSync(envPath)) {
            fs.writeFileSync(envPath, configTemplate);
            console.log('   ✓ .env.logs créé');
            console.log('   → Copiez ces variables dans votre fichier .env principal');
        } else {
            console.log('   - .env.logs existe déjà');
        }
    }

    async setupLogrotation() {
        console.log('\n🔄 Configuration de la rotation des logs...');

        const logrotateConfig = `/.logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 node node
    postrotate
        /usr/bin/killall -USR1 node
    endscript
}`;

        const logrotateDir = '/etc/logrotate.d';
        if (fs.existsSync(logrotateDir)) {
            console.log('   → Configuration logrotate disponible');
            console.log('   → Ajoutez la configuration ci-dessus à /etc/logrotate.d/node-logs');
        } else {
            console.log('   - Logrotate non disponible sur ce système');
        }
    }
}

// Exécution si appelé directement
if (require.main === module) {
    const setup = new LogSetup();
    setup.initialize().catch(console.error);
}

module.exports = LogSetup;
