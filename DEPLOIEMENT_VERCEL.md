# 🚀 Déploiement sur Vercel - SkyOrbit ULM Gestion Club

## 📋 Prérequis

1. **Compte Vercel** : https://vercel.com/signup
2. **Repository GitHub** : https://github.com/denjs18/SkyOrbit
3. **Clé API OpenWeatherMap** : https://openweathermap.org/api (gratuit)

---

## ⚡ Déploiement Rapide (5 minutes)

### Étape 1 : Connecter votre Repository

1. **Allez sur Vercel** : https://vercel.com/new
2. **Importez votre repository GitHub** : `denjs18/SkyOrbit`
3. Cliquez sur **"Import"**

### Étape 2 : Configurer le Projet

Dans l'écran de configuration :

**Framework Preset** : `Other` (ou laissez vide)

**Root Directory** : `.` (racine)

**Build Command** : Laissez vide (projet statique)

**Output Directory** : `.` (racine)

### Étape 3 : Variables d'Environnement OBLIGATOIRES

Cliquez sur **"Environment Variables"** et ajoutez :

#### 🌤️ API MÉTÉO (OBLIGATOIRE)

```plaintext
OPENWEATHER_API_KEY = votre_cle_api_openweathermap
```

**Comment obtenir** :
1. Allez sur https://openweathermap.org/api
2. Créez un compte gratuit
3. Générez une clé API (plan gratuit : 60 appels/minute)
4. Copiez la clé

#### 📍 LOCALISATION (RECOMMANDÉ)

```plaintext
LOCATION_LAT = 43.5352
LOCATION_LON = 5.3672
LOCATION_NAME = Aérodrome de Provence
LOCATION_ICAO = LFML
```

**Personnalisez** avec vos coordonnées GPS.

#### 🏢 INFORMATIONS DU CLUB (RECOMMANDÉ)

```plaintext
CLUB_NAME = Mon Club ULM
CLUB_EMAIL = contact@mon-club-ulm.fr
CLUB_PHONE = 01 23 45 67 89
```

### Étape 4 : Déployer

1. Cliquez sur **"Deploy"**
2. Attendez 2-3 minutes
3. Votre site est en ligne ! 🎉

**URL** : `https://votre-projet.vercel.app`

---

## 🔧 Configuration Avancée

### Variables d'Environnement Optionnelles

#### 📧 Configuration Email (pour notifications)

```plaintext
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_ENCRYPTION = tls
SMTP_USERNAME = votre-email@gmail.com
SMTP_PASSWORD = votre-mot-de-passe-application
SMTP_FROM_EMAIL = noreply@votre-club.fr
SMTP_FROM_NAME = SkyOrbit ULM Club
```

**Pour Gmail** :
1. Activez la validation en 2 étapes
2. Générez un "Mot de passe d'application"
3. Utilisez ce mot de passe dans `SMTP_PASSWORD`

#### 💳 Paiements en Ligne (Stripe)

```plaintext
STRIPE_PUBLIC_KEY = pk_live_XXXXXXXXXXXXXXXX
STRIPE_SECRET_KEY = sk_live_XXXXXXXXXXXXXXXX
```

**Obtenir les clés** :
1. Créez un compte sur https://stripe.com
2. Allez dans Développeurs > Clés API
3. Copiez vos clés (utilisez les clés de test d'abord)

#### 🗄️ Base de Données (Vercel Postgres)

```plaintext
DATABASE_URL = postgresql://user:password@host:5432/database
```

**Activer Vercel Postgres** :
1. Dans votre projet Vercel, allez dans "Storage"
2. Cliquez sur "Create Database"
3. Sélectionnez "Postgres"
4. Les variables seront ajoutées automatiquement

#### 🔐 Sécurité

```plaintext
SECRET_KEY = generer-une-cle-aleatoire-tres-longue-32-caracteres-minimum
APP_ENV = production
APP_DEBUG = false
```

**Générer une clé secrète** :
```bash
# Sous Linux/Mac
openssl rand -base64 32

# Ou utilisez un générateur en ligne
# https://randomkeygen.com/
```

#### 📦 Stockage Fichiers (Vercel Blob)

```plaintext
BLOB_READ_WRITE_TOKEN = vercel_blob_rw_XXXXXXXX
```

**Activer Vercel Blob** :
1. Dans votre projet, allez dans "Storage"
2. Créez un "Blob Store"
3. Les variables seront ajoutées automatiquement

#### 🔄 Cache (Vercel KV - Redis)

```plaintext
KV_REST_API_URL = https://xxxxx.upstash.io
KV_REST_API_TOKEN = xxxxx
```

**Activer Vercel KV** :
1. Dans "Storage", créez un "KV Store"
2. Les variables seront ajoutées automatiquement

---

## 📊 Variables par Priorité

### ⭐ ESSENTIELLES (Démarrage minimum)

```plaintext
OPENWEATHER_API_KEY = votre_cle_api
LOCATION_LAT = 43.5352
LOCATION_LON = 5.3672
CLUB_NAME = Mon Club ULM
```

### 🔵 IMPORTANTES (Fonctionnalités complètes)

```plaintext
CLUB_EMAIL = contact@club.fr
CLUB_PHONE = 01 23 45 67 89
SMTP_HOST = smtp.gmail.com
SMTP_USERNAME = email@gmail.com
SMTP_PASSWORD = mot_de_passe
SECRET_KEY = cle-secrete-aleatoire
```

### 🟢 OPTIONNELLES (Fonctionnalités avancées)

```plaintext
DATABASE_URL = postgresql://...
STRIPE_PUBLIC_KEY = pk_...
STRIPE_SECRET_KEY = sk_...
BLOB_READ_WRITE_TOKEN = vercel_blob_...
KV_REST_API_URL = https://...
```

---

## 🌍 Nom de Domaine Personnalisé

### Ajouter votre Domaine

1. Dans votre projet Vercel, allez dans **"Settings"** > **"Domains"**
2. Ajoutez votre domaine : `www.monclub-ulm.fr`
3. Suivez les instructions DNS
4. SSL automatique activé !

### Configuration DNS

Ajoutez ces enregistrements chez votre registrar :

**Type A** :
```
@    A    76.76.21.21
```

**Type CNAME** :
```
www  CNAME  cname.vercel-dns.com
```

---

## 🔄 Mises à Jour Automatiques

Vercel déploie automatiquement à chaque push sur GitHub :

```bash
# Faites vos modifications
git add .
git commit -m "Mise à jour"
git push origin main

# Vercel déploie automatiquement !
```

---

## 📱 Environnements Multiples

### Production (main)
- URL : `https://skyorbit.vercel.app`
- Variables : Production
- Branche : `main`

### Staging (develop)
- URL : `https://skyorbit-dev.vercel.app`
- Variables : Staging
- Branche : `develop`

### Preview (Pull Requests)
- URL : `https://skyorbit-pr-123.vercel.app`
- Variables : Preview
- Créé automatiquement pour chaque PR

**Configurer** :
1. Créez les branches `develop` et `staging`
2. Dans Vercel Settings > Git, configurez les branches
3. Ajoutez des variables d'environnement par environnement

---

## 🐛 Dépannage

### "Site not loading"

**Vérifiez** :
- Les logs dans Vercel Dashboard > Deployments > [votre déploiement] > Functions
- Que toutes les variables obligatoires sont configurées

### "API météo ne fonctionne pas"

**Vérifiez** :
- Votre clé `OPENWEATHER_API_KEY` est valide
- Vous n'avez pas dépassé la limite (60 appels/min gratuit)
- La clé est bien configurée dans Vercel > Settings > Environment Variables

### "Emails ne s'envoient pas"

**Vérifiez** :
- Configuration SMTP correcte
- Pour Gmail : mot de passe d'application (pas votre mot de passe normal)
- Port 587 avec TLS

### "404 sur certaines pages"

**Vérifiez** :
- Votre `vercel.json` est correctement configuré
- Les routes sont définies

---

## ⚡ Optimisations Performance

### 1. Activer le Cache

Dans `vercel.json`, ajoutez :

```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 2. Activer la Compression

Automatique sur Vercel ! Gzip et Brotli activés par défaut.

### 3. CDN Global

Vercel utilise un CDN global automatiquement. Votre site est rapide partout !

### 4. Analytics

Activez Vercel Analytics :
1. Dans votre projet > Analytics
2. Cliquez sur "Enable"
3. Ajoutez le script dans vos HTML (ou activez via dashboard)

---

## 💰 Coûts Vercel

### Plan Hobby (Gratuit)
- ✅ Parfait pour commencer
- 100 GB bande passante/mois
- Builds illimités
- SSL automatique
- Analytics de base

### Plan Pro ($20/mois)
- 1 TB bande passante
- Support prioritaire
- Analytics avancés
- Environments illimités
- Collaboration en équipe

**Pour un club ULM** : Le plan gratuit est largement suffisant !

---

## 🔒 Sécurité sur Vercel

### Headers de Sécurité

Déjà configurés dans `.htaccess`, Vercel les applique automatiquement :
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- HSTS

### HTTPS

Automatique et gratuit ! Certificat SSL renouvelé automatiquement.

### Variables d'Environnement

Stockées de manière sécurisée, jamais exposées dans le code source.

---

## 📞 Support

### Ressources Vercel

- **Documentation** : https://vercel.com/docs
- **Support** : https://vercel.com/support
- **Community** : https://github.com/vercel/vercel/discussions

### Ressources SkyOrbit

- **GitHub Issues** : https://github.com/denjs18/SkyOrbit/issues
- **Documentation** : Voir fichiers GUIDE_UTILISATEUR.md et INSTALLATION.md

---

## ✅ Checklist de Déploiement

Avant de mettre en production :

- [ ] Clé API OpenWeatherMap configurée
- [ ] Coordonnées GPS de votre aérodrome
- [ ] Informations du club (nom, email, téléphone)
- [ ] SMTP configuré pour les emails
- [ ] Clé secrète générée
- [ ] Variables `APP_ENV=production` et `APP_DEBUG=false`
- [ ] Nom de domaine personnalisé configuré (optionnel)
- [ ] Base de données créée (si nécessaire)
- [ ] Paiements Stripe configurés (si nécessaire)
- [ ] Testé sur mobile et desktop
- [ ] Changé tous les mots de passe par défaut
- [ ] Analytics activé

---

## 🎉 Votre Site est Déployé !

Félicitations ! Votre plateforme **SkyOrbit ULM Gestion Club** est maintenant en ligne.

**URL** : `https://votre-projet.vercel.app`

**Prochaines étapes** :
1. Testez toutes les fonctionnalités
2. Personnalisez le design (logo, couleurs)
3. Ajoutez votre contenu (membres, machines, actualités)
4. Partagez l'URL avec vos membres !

---

**Bon vol avec SkyOrbit ! 🚁✈️**
