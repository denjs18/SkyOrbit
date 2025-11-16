<?php
/**
 * Configuration Example - ULM Gestion Club
 *
 * Copiez ce fichier en config.php et remplissez vos informations
 */

return [
    // Configuration de la base de données
    'database' => [
        'host' => 'localhost',
        'dbname' => 'ulm_gestion_club',
        'username' => 'votre_utilisateur',
        'password' => 'votre_mot_de_passe',
        'charset' => 'utf8mb4',
        'port' => 3306
    ],

    // Configuration des APIs externes
    'api' => [
        // OpenWeatherMap API (gratuit sur openweathermap.org)
        'openweather' => [
            'api_key' => 'VOTRE_CLE_API_OPENWEATHERMAP',
            'base_url' => 'https://api.openweathermap.org/data/2.5',
            'units' => 'metric', // metric = Celsius, imperial = Fahrenheit
            'lang' => 'fr'
        ],

        // METAR/TAF API (optionnel)
        'aviation_weather' => [
            'base_url' => 'https://avwx.rest/api',
            'api_key' => 'VOTRE_CLE_API_AVWX' // optionnel
        ]
    ],

    // Coordonnées géographiques de votre aérodrome
    'location' => [
        'name' => 'Aérodrome de Provence',
        'latitude' => 43.5352, // Exemple: Marseille-Provence
        'longitude' => 5.3672,
        'altitude' => 20, // mètres
        'icao_code' => 'LFML', // Code OACI pour METAR/TAF
        'timezone' => 'Europe/Paris'
    ],

    // Informations de l'association
    'club' => [
        'name' => 'Mon Club ULM',
        'legal_name' => 'Association Mon Club ULM',
        'address' => 'Adresse de votre aérodrome',
        'postal_code' => '13000',
        'city' => 'Marseille',
        'country' => 'France',
        'phone' => '01 23 45 67 89',
        'email' => 'contact@mon-club-ulm.fr',
        'website' => 'https://www.mon-club-ulm.fr',
        'siret' => '123 456 789 00012', // Optionnel
        'rna' => 'W123456789' // Numéro RNA de l'association
    ],

    // Configuration Email (SMTP)
    'email' => [
        'enabled' => true,
        'smtp' => [
            'host' => 'smtp.gmail.com',
            'port' => 587,
            'encryption' => 'tls', // tls ou ssl
            'username' => 'votre-email@gmail.com',
            'password' => 'votre-mot-de-passe-application',
            'auth' => true
        ],
        'from' => [
            'email' => 'noreply@mon-club-ulm.fr',
            'name' => 'Mon Club ULM'
        ],
        'admin_email' => 'admin@mon-club-ulm.fr', // Pour les notifications importantes
        'reply_to' => 'contact@mon-club-ulm.fr'
    ],

    // Configuration des paiements en ligne (optionnel)
    'payment' => [
        'enabled' => false,

        // Stripe
        'stripe' => [
            'enabled' => false,
            'public_key' => 'pk_test_XXXXXXXXXXXXXXXX',
            'secret_key' => 'sk_test_XXXXXXXXXXXXXXXX',
            'currency' => 'eur'
        ],

        // PayPal
        'paypal' => [
            'enabled' => false,
            'client_id' => 'VOTRE_CLIENT_ID_PAYPAL',
            'secret' => 'VOTRE_SECRET_PAYPAL',
            'mode' => 'sandbox' // sandbox ou live
        ]
    ],

    // Paramètres de sécurité
    'security' => [
        'session_lifetime' => 3600, // 1 heure en secondes
        'session_name' => 'ulm_session',
        'password_min_length' => 8,
        'password_require_uppercase' => true,
        'password_require_number' => true,
        'password_require_special' => false,
        'max_login_attempts' => 5,
        'lockout_duration' => 900, // 15 minutes
        'enable_2fa' => false, // Authentification à 2 facteurs
        'allowed_upload_types' => ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
        'max_upload_size' => 5242880, // 5 MB en octets
    ],

    // Paramètres de l'application
    'app' => [
        'name' => 'ULM Gestion Club',
        'version' => '1.0.0',
        'debug' => false, // TOUJOURS false en production !
        'maintenance_mode' => false,
        'timezone' => 'Europe/Paris',
        'locale' => 'fr_FR',
        'date_format' => 'd/m/Y',
        'time_format' => 'H:i',
        'datetime_format' => 'd/m/Y H:i'
    ],

    // Paramètres des réservations
    'reservations' => [
        'min_duration' => 30, // minutes
        'max_duration' => 480, // 8 heures
        'booking_advance_days' => 30, // Combien de jours à l'avance
        'cancellation_hours' => 24, // Délai d'annulation gratuite
        'auto_confirm' => false, // Confirmation automatique
        'require_instructor_approval' => true, // Pour les formations
        'reminder_hours' => 24, // Rappel X heures avant
        'opening_hours' => [
            'monday' => ['09:00', '18:00'],
            'tuesday' => ['09:00', '18:00'],
            'wednesday' => ['09:00', '18:00'],
            'thursday' => ['09:00', '18:00'],
            'friday' => ['09:00', '18:00'],
            'saturday' => ['09:00', '18:00'],
            'sunday' => ['09:00', '18:00']
        ]
    ],

    // Paramètres des baptêmes
    'baptemes' => [
        'formules' => [
            'decouverte' => [
                'name' => 'Découverte',
                'price' => 70,
                'duration' => 15,
                'description' => '15 minutes de vol, survol de la région, photo souvenir',
                'max_passengers' => 1
            ],
            'sensation' => [
                'name' => 'Sensation',
                'price' => 120,
                'duration' => 30,
                'description' => '30 minutes de vol, prise en main, photos + vidéo',
                'max_passengers' => 1
            ],
            'prestige' => [
                'name' => 'Prestige',
                'price' => 200,
                'duration' => 60,
                'description' => '60 minutes de vol, pilotage accompagné, pack photos/vidéos, certificat',
                'max_passengers' => 2
            ]
        ],
        'max_weight_per_passenger' => 110, // kg
        'min_age' => 15, // ans
        'require_parental_consent' => true, // Pour les mineurs
        'advance_booking_days' => 7, // Réserver au moins X jours à l'avance
        'deposit_required' => false,
        'deposit_percentage' => 30 // Si deposit_required = true
    ],

    // Paramètres météo
    'weather' => [
        'update_interval' => 300, // 5 minutes en secondes
        'cache_duration' => 600, // 10 minutes
        'wind_limit_kmh' => 25, // Limite de vent pour voler
        'visibility_limit_km' => 5, // Limite de visibilité
        'alert_thresholds' => [
            'wind_strong' => 20, // km/h
            'wind_extreme' => 30, // km/h
            'visibility_poor' => 5, // km
            'visibility_bad' => 3 // km
        ]
    ],

    // Paramètres de maintenance
    'maintenance' => [
        'intervals' => [
            'daily_check' => 1, // Vérification journalière
            'service_50h' => 50, // Révision 50h
            'service_100h' => 100, // Révision 100h
            'annual' => 365 // Révision annuelle en jours
        ],
        'reminder_before_hours' => 5, // Rappel X heures avant échéance
        'auto_disable_overdue' => true // Désactiver auto si maintenance en retard
    ],

    // Logs et monitoring
    'logging' => [
        'enabled' => true,
        'level' => 'info', // debug, info, warning, error, critical
        'path' => __DIR__ . '/../logs',
        'max_files' => 30, // Conserver 30 jours de logs
        'log_queries' => false // Logger les requêtes SQL (debug uniquement)
    ],

    // Cache
    'cache' => [
        'enabled' => true,
        'driver' => 'file', // file, redis, memcached
        'ttl' => 3600, // 1 heure par défaut
        'path' => __DIR__ . '/../cache'
    ],

    // Uploads et fichiers
    'uploads' => [
        'path' => __DIR__ . '/../uploads',
        'url' => '/uploads',
        'allowed_types' => ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
        'max_size' => 5242880, // 5 MB
        'image_max_width' => 2000,
        'image_max_height' => 2000,
        'create_thumbnails' => true,
        'thumbnail_width' => 300,
        'thumbnail_height' => 300
    ],

    // Sauvegarde automatique
    'backup' => [
        'enabled' => true,
        'schedule' => 'daily', // daily, weekly, monthly
        'time' => '02:00', // Heure de sauvegarde
        'path' => __DIR__ . '/../backups',
        'keep_backups' => 30, // Nombre de sauvegardes à conserver
        'include_uploads' => true,
        'compress' => true
    ],

    // Notifications
    'notifications' => [
        'email' => [
            'new_reservation' => true,
            'reservation_confirmed' => true,
            'reservation_cancelled' => true,
            'maintenance_due' => true,
            'bapteme_request' => true,
            'payment_received' => true,
            'membership_expiring' => true
        ],
        'sms' => [
            'enabled' => false,
            'provider' => 'twilio', // twilio, ovh, etc.
            'api_key' => 'VOTRE_CLE_API_SMS'
        ]
    ],

    // Personnalisation
    'customization' => [
        'logo' => '/assets/img/logo.png',
        'favicon' => '/assets/img/favicon.ico',
        'primary_color' => '#0ea5e9',
        'secondary_color' => '#64748b',
        'theme' => 'light', // light, dark, auto
        'show_weather_widget' => true,
        'show_quick_stats' => true,
        'default_language' => 'fr'
    ]
];
