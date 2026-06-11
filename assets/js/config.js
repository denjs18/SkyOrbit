// ============================================
// CONFIGURATION DE L'APPLICATION - Horizon Libre
// ============================================
// Renseignez les valeurs ci-dessous après avoir créé votre projet
// Supabase (https://supabase.com — gratuit pour une association).
// Tant que les valeurs SUPABASE_* sont vides, l'application fonctionne
// en MODE DÉMONSTRATION : les données restent dans le navigateur.
//
// La clé "anon" Supabase est publique par conception : elle peut être
// committée, la sécurité repose sur les règles RLS (voir supabase/schema.sql).

window.APP_CONFIG = {
    CLUB_NAME: 'Horizon Libre',

    // Projet Supabase : Settings > API
    SUPABASE_URL: '',          // ex: https://abcdefgh.supabase.co
    SUPABASE_ANON_KEY: '',     // clé "anon / public"

    // Campagne HelloAsso pour le paiement des baptêmes
    // ex: https://www.helloasso.com/associations/horizon-libre/evenements/bapteme-ulm
    HELLOASSO_CAMPAIGN_URL: '',

    // Clé OpenWeatherMap pour la page météo (https://openweathermap.org/api)
    OPENWEATHER_API_KEY: '',

    // Coordonnées du terrain (pour la météo)
    LATITUDE: 47.0,
    LONGITUDE: 2.0,

    // Formules de baptême (tarifs provisoires, à ajuster par le bureau)
    FORMULES: {
        decouverte: { label: 'Découverte', price: 60, duration: 15, description: '15 minutes de vol, survol de la région, photo souvenir' },
        sensation: { label: 'Sensation', price: 90, duration: 30, description: '30 minutes de vol, prise en main, photos + vidéo' },
        prestige: { label: 'Prestige', price: 150, duration: 60, description: '60 minutes de vol, pilotage accompagné, pack photos/vidéos, certificat' }
    }
};
