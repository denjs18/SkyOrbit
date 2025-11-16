# Guide d'Installation - ULM Gestion Club

## 📋 Prérequis

### Serveur Web
- **Serveur HTTP** : Apache 2.4+ ou Nginx 1.18+
- **PHP** : Version 8.0 ou supérieure (pour la version backend complète)
- **Base de données** : MySQL 8.0+ ou MariaDB 10.5+
- **Node.js** : Version 16+ (optionnel, pour le développement)

### Configuration minimale
- 2 Go de RAM
- 10 Go d'espace disque
- Connexion Internet pour les APIs météo

## 🚀 Installation

### Étape 1 : Téléchargement et Extraction

```bash
# Cloner ou extraire le projet dans votre dossier web
cd /var/www/html
# ou pour Windows avec XAMPP
cd C:/xampp/htdocs

# Extraire les fichiers
unzip ulm-gestion-club.zip
cd ulm-gestion-club
```

### Étape 2 : Configuration de la Base de Données

1. **Créer la base de données**

```sql
CREATE DATABASE ulm_gestion_club CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ulm_user'@'localhost' IDENTIFIED BY 'votre_mot_de_passe_securise';
GRANT ALL PRIVILEGES ON ulm_gestion_club.* TO 'ulm_user'@'localhost';
FLUSH PRIVILEGES;
```

2. **Importer le schéma** (à créer pour la version complète)

```bash
mysql -u ulm_user -p ulm_gestion_club < database/schema.sql
```

### Étape 3 : Configuration de l'Application

1. **Créer le fichier de configuration**

Créer `config/config.php` :

```php
<?php
return [
    'database' => [
        'host' => 'localhost',
        'dbname' => 'ulm_gestion_club',
        'username' => 'ulm_user',
        'password' => 'votre_mot_de_passe_securise',
        'charset' => 'utf8mb4'
    ],

    'api' => [
        'openweather_key' => 'VOTRE_CLE_API_OPENWEATHERMAP',
        'metar_endpoint' => 'https://avwx.rest/api',
    ],

    'site' => [
        'name' => 'Mon Club ULM',
        'email' => 'contact@monclub-ulm.fr',
        'phone' => '01 23 45 67 89',
        'address' => 'Adresse de votre aérodrome'
    ],

    'security' => [
        'session_lifetime' => 3600, // 1 heure
        'password_min_length' => 8,
        'enable_2fa' => false
    ]
];
```

2. **Obtenir une clé API OpenWeatherMap** (gratuit)

- Visitez https://openweathermap.org/api
- Créez un compte gratuit
- Générez une clé API
- Copiez-la dans `config/config.php`

### Étape 4 : Permissions des Fichiers

```bash
# Linux/Mac
chmod -R 755 ulm-gestion-club
chmod -R 777 uploads
chmod 600 config/config.php

# Vérifier que le serveur web peut écrire dans certains dossiers
chown -R www-data:www-data uploads logs cache
```

### Étape 5 : Configuration du Serveur Web

#### Apache (.htaccess déjà inclus)

Assurez-vous que `mod_rewrite` est activé :

```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

#### Nginx

Ajouter dans votre configuration de serveur :

```nginx
server {
    listen 80;
    server_name votre-domaine.fr;
    root /var/www/html/ulm-gestion-club;
    index index.html index.php;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.0-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }

    location ~ /\. {
        deny all;
    }
}
```

### Étape 6 : Premier Lancement

1. **Accéder à l'application**

```
http://localhost/ulm-gestion-club
# ou
http://votre-domaine.fr
```

2. **Connexion de démonstration**

- **Admin** : `admin@ulm-club.fr` / `admin123`
- **Instructeur** : `instructeur@ulm-club.fr` / `inst123`
- **Pilote** : `pilote@ulm-club.fr` / `pilot123`

⚠️ **IMPORTANT** : Changez immédiatement ces mots de passe après la première connexion !

## 🔧 Configuration Avancée

### Configurer les Emails

Pour l'envoi d'emails (confirmations de réservation, etc.), configurer dans `config/email.php` :

```php
<?php
return [
    'smtp' => [
        'host' => 'smtp.gmail.com',
        'port' => 587,
        'username' => 'votre-email@gmail.com',
        'password' => 'votre-mot-de-passe-app',
        'encryption' => 'tls'
    ],
    'from' => [
        'email' => 'noreply@votre-club.fr',
        'name' => 'Mon Club ULM'
    ]
];
```

### Configurer les Paiements en Ligne (optionnel)

Pour accepter les paiements de baptêmes en ligne, configurer Stripe ou PayPal dans `config/payment.php`.

### Personnalisation

1. **Logo et Images**
   - Remplacer `assets/img/logo.png` par votre logo
   - Ajouter des photos de vos ULM dans `assets/img/machines/`

2. **Couleurs et Design**
   - Modifier les variables CSS dans `assets/css/style.css`
   - Variables principales dans `:root`

3. **Coordonnées GPS**
   - Modifier les coordonnées dans `assets/js/weather.js` pour votre localisation

## 📱 Version Mobile / PWA (optionnel)

Pour installer comme application mobile :

1. Ajouter `manifest.json` à la racine
2. Enregistrer un Service Worker
3. Les utilisateurs pourront "Installer l'application" depuis leur navigateur

## 🔒 Sécurité

### Recommandations Importantes

1. **HTTPS Obligatoire** en production
   ```bash
   # Avec Let's Encrypt (gratuit)
   sudo certbot --nginx -d votre-domaine.fr
   ```

2. **Sauvegardes Régulières**
   ```bash
   # Script de sauvegarde automatique
   #!/bin/bash
   mysqldump -u ulm_user -p ulm_gestion_club > backup_$(date +%Y%m%d).sql
   tar -czf backup_files_$(date +%Y%m%d).tar.gz /var/www/html/ulm-gestion-club
   ```

3. **Mises à jour**
   - Vérifier régulièrement les mises à jour
   - Tester en environnement de développement avant la production

4. **Pare-feu**
   ```bash
   # Exemple avec UFW
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

## 🐛 Dépannage

### Problème de connexion à la base de données

```bash
# Vérifier que MySQL est démarré
sudo systemctl status mysql

# Tester la connexion
mysql -u ulm_user -p
```

### Erreur 404 ou 500

- Vérifier les logs Apache/Nginx : `/var/log/apache2/error.log`
- Vérifier les permissions des fichiers
- Activer le mode debug dans `config/config.php`

### API Météo ne fonctionne pas

- Vérifier votre clé API OpenWeatherMap
- Vérifier que le serveur peut faire des requêtes HTTP sortantes
- Consulter la limite de requêtes gratuite (60 appels/minute)

## 📞 Support

Pour toute question ou problème :

- **Documentation complète** : `/docs`
- **Issues GitHub** : [Signaler un bug](https://github.com/votre-repo/issues)
- **Email** : support@ulm-gestion-club.fr

## 🎉 Félicitations !

Votre plateforme ULM Gestion Club est maintenant installée et prête à l'emploi.

Profitez de toutes ses fonctionnalités pour gérer efficacement votre association !
