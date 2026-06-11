# SkyOrbit — Gestion du club ULM Horizon Libre

Application web de gestion pour l'association d'ULM **Horizon Libre** :
réservations de machines, membres et cotisations, carnet de maintenance,
baptêmes de l'air payants (HelloAsso) et météo du terrain.

Le périmètre fonctionnel et les décisions du projet sont documentés dans
[CAHIER_DES_CHARGES.md](CAHIER_DES_CHARGES.md).

## Fonctionnalités (V1)

- **Réservations** — calendrier partagé des créneaux, détection de conflit,
  validation par le bureau, clôture des vols avec saisie des heures réelles
- **Membres & cotisations** — fiches membres, rôles (bureau, instructeur,
  pilote, membre), licences et visites médicales avec alertes d'échéance,
  suivi des cotisations annuelles
- **Machines & maintenance** — inventaire, compteur d'heures alimenté par
  les vols clôturés, échéances de visite avec alertes, journal d'entretien
- **Baptêmes de l'air** — page publique de réservation, paiement HelloAsso,
  back-office (affectation pilote/machine, suivi des statuts et revenus)
- **Météo** — conditions du terrain via OpenWeatherMap, METAR/TAF

## Architecture

- **Frontend** : HTML/CSS/JavaScript vanilla, Bootstrap 5, FullCalendar —
  hébergé sur **Vercel** (site statique)
- **Backend** : **Supabase** (PostgreSQL + authentification + API), schéma
  et règles de sécurité dans [supabase/schema.sql](supabase/schema.sql)
- **Paiements** : HelloAsso (lien de campagne, gratuit pour les associations)

### Mode démonstration

Tant que Supabase n'est pas configuré dans `assets/js/config.js`,
l'application fonctionne en **mode démo** : les données restent dans le
navigateur (localStorage) et des comptes de test sont proposés sur la page
de connexion (`admin@horizon-libre.fr` / `admin123`, etc.). Il suffit
d'ouvrir `index.html` ou de déployer tel quel pour tester.

## Installation

Voir [INSTALLATION.md](INSTALLATION.md) pour la mise en production
complète : création du projet Supabase, exécution du schéma SQL,
configuration des clés, déploiement Vercel et branchement HelloAsso.

## Structure

```
index.html              Connexion
dashboard.html          Tableau de bord (stats, alertes)
reservations.html       Réservations (calendrier, liste, planning)
members.html            Membres & cotisations
machines.html           Machines & maintenance
baptemes.html           Baptêmes — administration (bureau uniquement)
baptemes-public.html    Baptêmes — page publique de réservation
weather.html            Météo du terrain
assets/js/config.js     Configuration (clés Supabase, HelloAsso, météo, tarifs)
assets/js/db.js         Couche de données (Supabase ou mode démo)
supabase/schema.sql     Schéma PostgreSQL + règles de sécurité (RLS)
```

## Licence

Copyright 2026 Horizon Libre — Tous droits réservés
