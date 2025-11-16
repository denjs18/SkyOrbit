# 🚀 Démarrage Rapide - ULM Gestion Club

## 📁 Structure du Projet

```
ulm-gestion-club/
├── index.html                  # Page de connexion
├── dashboard.html              # Tableau de bord principal
├── reservations.html           # Gestion des réservations
├── weather.html                # Conditions météo
├── baptemes.html              # Gestion des baptêmes (admin)
├── baptemes-public.html       # Page publique de réservation
├── .htaccess                   # Configuration Apache
├── config.example.php          # Exemple de configuration
│
├── assets/
│   ├── css/
│   │   ├── style.css          # Styles page de connexion
│   │   └── dashboard.css      # Styles dashboard et pages internes
│   ├── js/
│   │   ├── login.js           # Logique page de connexion
│   │   ├── main.js            # Fonctions communes
│   │   ├── dashboard.js       # Logique dashboard
│   │   ├── weather.js         # Logique météo
│   │   ├── reservations.js    # Logique réservations
│   │   └── baptemes.js        # Logique baptêmes
│   └── img/
│       └── default-avatar.svg # Avatar par défaut
│
├── README.md                   # Présentation du projet
├── INSTALLATION.md             # Guide d'installation complet
├── GUIDE_UTILISATEUR.md        # Guide d'utilisation
├── FONCTIONNALITES.md         # Liste complète des fonctionnalités
└── DEMARRAGE_RAPIDE.md        # Ce fichier
```

---

## ⚡ Installation en 5 Minutes

### Option 1 : Test Local Simple (sans base de données)

1. **Copier les fichiers**
   ```bash
   # Copier le dossier dans votre serveur web
   # Windows (XAMPP) : C:/xampp/htdocs/
   # Mac (MAMP) : /Applications/MAMP/htdocs/
   # Linux : /var/www/html/
   ```

2. **Accéder au site**
   ```
   http://localhost/ulm-gestion-club
   ```

3. **Se connecter avec un compte de démo**
   - Admin : `admin@ulm-club.fr` / `admin123`
   - Instructeur : `instructeur@ulm-club.fr` / `inst123`
   - Pilote : `pilote@ulm-club.fr` / `pilot123`

**Note** : Dans cette version, les données sont simulées en JavaScript et ne sont pas persistées.

---

### Option 2 : Installation Complète (avec base de données)

**Prérequis** :
- Serveur web (Apache/Nginx)
- PHP 8.0+
- MySQL 8.0+ ou MariaDB 10.5+

**Étapes** :

1. **Créer la base de données**
   ```sql
   CREATE DATABASE ulm_gestion_club;
   ```

2. **Configurer l'application**
   ```bash
   cp config.example.php config.php
   # Éditer config.php avec vos paramètres
   ```

3. **Obtenir une clé API météo** (gratuit)
   - Aller sur https://openweathermap.org/api
   - Créer un compte
   - Générer une clé API
   - L'ajouter dans `config.php`

4. **Accéder au site**
   ```
   http://localhost/ulm-gestion-club
   ```

Pour plus de détails, voir [INSTALLATION.md](INSTALLATION.md)

---

## 🎯 Premiers Pas

### 1. Connexion

- Ouvrez `http://localhost/ulm-gestion-club`
- Utilisez un compte de démonstration
- Cliquez sur "Décoller !"

### 2. Explorer le Dashboard

Le tableau de bord vous montre :
- 📊 Statistiques du jour
- 🌤️ Météo actuelle
- 📅 Réservations prévues
- 📰 Dernières actualités

### 3. Créer une Réservation

1. Cliquez sur "Réservations" dans le menu
2. Cliquez sur "Nouvelle réservation"
3. Remplissez le formulaire :
   - Machine
   - Pilote
   - Date et heures
   - Type de vol
4. Enregistrez

### 4. Consulter la Météo

1. Cliquez sur "Météo" dans le menu
2. Consultez les conditions actuelles
3. Vérifiez les conditions de vol
4. Consultez les prévisions 7 jours
5. Lisez le METAR/TAF

### 5. Gérer les Baptêmes

**Interface Admin** (`baptemes.html`) :
- Voir les demandes de baptêmes
- Confirmer/Annuler
- Gérer les paiements
- Envoyer des confirmations

**Page Publique** (`baptemes-public.html`) :
- Afficher au grand public
- Formulaire de réservation
- Présentation des formules

---

## 🔧 Configuration Rapide

### Personnaliser les Couleurs

Éditer `assets/css/style.css` :

```css
:root {
    --primary-color: #0ea5e9;     /* Couleur principale */
    --secondary-color: #64748b;   /* Couleur secondaire */
    --success-color: #10b981;     /* Vert */
    --warning-color: #f59e0b;     /* Orange */
    --danger-color: #ef4444;      /* Rouge */
}
```

### Modifier les Formules de Baptêmes

Éditer `assets/js/baptemes.js` :

```javascript
const formules = {
    decouverte: {
        nom: 'Découverte',
        prix: 70,
        duree: 15,
        description: 'Votre description'
    },
    // ... autres formules
};
```

### Configurer la Localisation pour la Météo

Éditer `assets/js/weather.js` :

```javascript
const WEATHER_CONFIG = {
    lat: 43.5352,  // Votre latitude
    lon: 5.3672,   // Votre longitude
    // ...
};
```

---

## 📱 Accès depuis un Mobile

Le site est **100% responsive** :

- 📱 Smartphone : Menu hamburger, interface adaptée
- 💻 Tablette : Layout optimisé
- 🖥️ Desktop : Expérience complète

Testez simplement en redimensionnant votre navigateur ou en ouvrant depuis votre téléphone.

---

## 🆘 Problèmes Courants

### "Erreur 404" en accédant au site

**Solution** :
- Vérifiez que les fichiers sont dans le bon dossier
- Vérifiez l'URL : `http://localhost/ulm-gestion-club/`

### Les images ne s'affichent pas

**Solution** :
- Créez le dossier `assets/img/` s'il n'existe pas
- Vérifiez les permissions (755)

### La météo ne fonctionne pas

**Solution** :
- Vérifiez votre clé API OpenWeatherMap dans `weather.js`
- Vérifiez que votre serveur peut faire des requêtes HTTP sortantes
- La version démo utilise des données simulées

### "Session expirée" à chaque rafraîchissement

**Solution** :
- En mode démo, c'est normal (pas de backend)
- Pour la version complète, vérifiez la configuration PHP

---

## 📚 Documentation Complète

- **[README.md](README.md)** - Vue d'ensemble du projet
- **[INSTALLATION.md](INSTALLATION.md)** - Installation détaillée
- **[GUIDE_UTILISATEUR.md](GUIDE_UTILISATEUR.md)** - Utilisation complète
- **[FONCTIONNALITES.md](FONCTIONNALITES.md)** - Liste de toutes les fonctionnalités

---

## 🎨 Personnalisation Avancée

### Ajouter votre Logo

1. Créez votre logo (PNG, format recommandé : 200x200px)
2. Nommez-le `logo.png`
3. Placez-le dans `assets/img/logo.png`
4. Il apparaîtra automatiquement dans la sidebar

### Modifier les Textes

Tous les textes sont directement dans les fichiers HTML. Ouvrez le fichier et modifiez :

- `index.html` - Textes de la page de connexion
- `dashboard.html` - Textes du tableau de bord
- `baptemes-public.html` - Textes de la page publique

### Ajouter des Pages

1. Dupliquez `dashboard.html`
2. Renommez-le (ex: `machines.html`)
3. Modifiez le contenu
4. Ajoutez un lien dans la sidebar de tous les fichiers HTML
5. Créez le fichier JS associé dans `assets/js/`

---

## 🚀 Passer en Production

Avant de mettre en ligne :

1. ✅ Changez TOUS les mots de passe par défaut
2. ✅ Activez HTTPS (certificat SSL)
3. ✅ Configurez les sauvegardes automatiques
4. ✅ Testez sur tous les navigateurs
5. ✅ Testez sur mobile
6. ✅ Configurez les emails (SMTP)
7. ✅ Ajoutez Google Analytics (optionnel)
8. ✅ Mettez `debug: false` dans la config

---

## 💡 Conseils Pro

### Sécurité
- Ne JAMAIS partager vos clés API
- Utilisez des mots de passe forts
- Activez l'authentification 2FA quand disponible
- Faites des sauvegardes régulières

### Performance
- Utilisez un CDN pour les assets statiques
- Activez la compression Gzip
- Optimisez vos images
- Utilisez le cache navigateur

### SEO (pour la page publique)
- Ajoutez des balises meta
- Créez un sitemap.xml
- Ajoutez robots.txt
- Optimisez les images (alt tags)

---

## 📞 Support

Besoin d'aide ?

- 📖 Consultez la [documentation complète](GUIDE_UTILISATEUR.md)
- 🐛 Signalez un bug : Créez une issue GitHub
- 💬 Communauté : Forum de discussion
- ✉️ Email : support@ulm-gestion-club.fr

---

## 🎉 Félicitations !

Vous êtes maintenant prêt à utiliser **ULM Gestion Club** !

**Prochain étape** : Explorez toutes les fonctionnalités dans le [Guide Utilisateur](GUIDE_UTILISATEUR.md)

---

**Bon vol ! ✈️**

*ULM Gestion Club - La solution complète pour votre association d'ULM*
