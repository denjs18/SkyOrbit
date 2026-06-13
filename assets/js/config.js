// ============================================
// CONFIGURATION DE LA PLATEFORME - SkyOrbit
// ============================================
// Renseignez les valeurs ci-dessous après avoir créé votre projet
// Supabase (https://supabase.com — gratuit). Tant que les valeurs
// SUPABASE_* sont vides, l'application fonctionne en MODE DÉMONSTRATION :
// les données restent dans le navigateur.
//
// La clé "anon" Supabase et la clé OpenWeatherMap sont publiques par
// conception : elles peuvent être committées. La sécurité des données
// repose sur les règles RLS (voir supabase/schema.sql).

window.APP_CONFIG = {
    // Projet Supabase : Settings > API
    SUPABASE_URL: 'https://qjreqqhcjwpwjsxqaaeo.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqcmVxcWhjandwd2pzeHFhYWVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNjM2NTMsImV4cCI6MjA5NjczOTY1M30.ZAc_oQtfrlJ97hbUdOc6GVKsI7j3tYjhscuxiaLSDJA',

    // Campagne HelloAsso pour le paiement des baptêmes
    // ex: https://www.helloasso.com/associations/horizon-libre/evenements/bapteme-ulm
    HELLOASSO_CAMPAIGN_URL: '',

    // La clé OpenWeatherMap n'est PLUS ici : elle est détenue côté serveur
    // par la fonction /api/weather (variable d'environnement Vercel
    // OPENWEATHER_API_KEY). Voir INSTALLATION.md.

    // Coordonnées de repli si le club du membre n'a pas de coordonnées.
    // Normalement, la météo utilise la latitude/longitude du terrain du club.
    LATITUDE: 43.8678,
    LONGITUDE: 1.4167,

    // Formules de baptême (tarifs provisoires, à ajuster par le bureau)
    FORMULES: {
        decouverte: { label: 'Découverte', price: 60, duration: 15, description: '15 minutes de vol, survol de la région, photo souvenir' },
        sensation: { label: 'Sensation', price: 90, duration: 30, description: '30 minutes de vol, prise en main, photos + vidéo' },
        prestige: { label: 'Prestige', price: 150, duration: 60, description: '60 minutes de vol, pilotage accompagné, pack photos/vidéos, certificat' }
    }
};
