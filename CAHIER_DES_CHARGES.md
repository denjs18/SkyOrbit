# Cahier des charges — SkyOrbit

> Document de cadrage validé le 10/06/2026. Il remplace les ambitions
> dispersées dans les autres fichiers de documentation : en cas de
> contradiction, c'est ce document qui fait foi.

## 1. Contexte

Application de gestion pour **Horizon Libre**, association d'ULM de
grande taille (plus de 60 membres), avec une activité régulière de
baptêmes de l'air payants ouverts au public.

État actuel du projet : prototype frontend (HTML/CSS/JS vanilla) avec
données de démonstration en localStorage. Aucune donnée partagée entre
utilisateurs, pas d'authentification réelle, pas de paiement.

## 2. Choix d'architecture (validés)

| Sujet | Décision |
|---|---|
| Hébergement frontend | **Vercel** (config déjà en place) |
| Backend / base de données | **Supabase** (PostgreSQL + Auth + API) |
| Authentification | Supabase Auth (email/mot de passe) |
| Paiement des baptêmes | **HelloAsso** (gratuit pour les associations) |
| Météo | OpenWeatherMap (clé API à configurer) |

Conséquence : la piste PHP/MySQL évoquée dans `INSTALLATION.md` et
`config.example.php` est **abandonnée**. Ces fichiers seront supprimés ou
réécrits lors de la mise en place du backend.

## 3. Périmètre de la version 1 (MVP)

Les quatre fonctionnalités suivantes sont **indispensables** et définissent
la V1. Rien d'autre ne doit retarder leur mise en service.

### 3.1 Réservations de machines
- Calendrier partagé des créneaux, visible par tous les membres connectés
- Réservation d'une machine sur un créneau, avec détection de conflit
- Validation/annulation par un administrateur ou instructeur
- Historique des vols par membre et par machine

### 3.2 Baptêmes de l'air payants (page publique)
- Page publique sans connexion : présentation des formules, calendrier
  des disponibilités, formulaire de réservation
- Paiement via **HelloAsso** (lien/widget de campagne) ; la réservation
  passe au statut « confirmée » après vérification du paiement
- Back-office : planning des baptêmes, affectation pilote/machine,
  suivi des statuts (en attente, payé, effectué, annulé)
- Email de confirmation au client

### 3.3 Membres et cotisations
- Fiche membre : coordonnées, licences, qualifications, dates de validité
- Rôles : **admin, instructeur, pilote, membre** (droits différenciés)
- Suivi des cotisations annuelles : montant, statut payé/impayé, relances
- Alerte sur licences ou visites médicales arrivant à échéance

### 3.4 Carnet machines / maintenance
- Inventaire des ULM : identification, type, documents
- Compteur d'heures de vol alimenté automatiquement par les réservations
  clôturées (saisie des heures réelles en fin de vol)
- Potentiels et échéances d'entretien, avec alerte à l'approche
- Journal des interventions de maintenance

## 4. Hors périmètre V1 (reporté)

- Gestion financière complète (facturation, rapports) — seul le suivi
  des paiements de cotisations et baptêmes est en V1
- Fil d'actualités / communication interne
- Application mobile, PWA, mode hors ligne, notifications push
- Tout ce qui est listé en « long terme » dans `RESUME_PROJET.md`
  (IA, IoT, blockchain…) : non prioritaire

La page météo existante est conservée telle quelle (il suffit d'une clé
API), mais aucune amélioration météo n'est prévue en V1.

## 5. Modèle de données (esquisse Supabase)

- `profiles` — extension du compte Supabase Auth : nom, rôle, téléphone,
  licences, dates de validité, statut cotisation
- `machines` — immatriculation, type, heures totales, potentiel,
  prochaine échéance d'entretien
- `reservations` — machine, membre, début, fin, statut, heures réelles
- `maintenance_logs` — machine, date, description, heures au compteur
- `baptemes` — créneau, formule, client (nom, email, téléphone),
  pilote affecté, machine, statut, référence de paiement HelloAsso
- `cotisations` — membre, année, montant, statut, date de paiement

Les règles d'accès (Row Level Security) reflètent les rôles : un membre
ne voit que ses propres données sensibles ; instructeurs et admins ont
des droits élargis.

## 6. Plan de réalisation proposé

1. **Socle** : projet Supabase, schéma de base, authentification réelle
   en remplacement des comptes de démonstration
2. **Réservations** : brancher le calendrier existant sur Supabase
3. **Membres & cotisations** : créer `members.html` et le back-office rôles
4. **Machines & maintenance** : créer `machines.html`, lier aux réservations
5. **Baptêmes + HelloAsso** : brancher la page publique, intégrer le
   paiement, emails de confirmation
6. **Finitions** : alertes (licences, maintenance), nettoyage de la doc
   obsolète (PHP/MySQL), mise en production sur Vercel

## 7. Décisions complémentaires (10/06/2026)

- **Nom du club : Horizon Libre.** Coordonnées (adresse, téléphone,
  email) à fournir plus tard ; des valeurs génériques restent affichées
  en attendant.
- **Liste des machines : à fournir plus tard.** L'inventaire démarre
  vide ; les machines seront saisies via l'interface d'administration.
- **HelloAsso : pas encore de compte.** L'intégration est préparée côté
  application ; le lien vers la campagne HelloAsso sera branché quand le
  compte de l'association sera créé.
- **Validation des réservations : le bureau uniquement** (rôle admin).
  Les instructeurs n'ont pas ce droit pour l'instant.
- **Aucune limitation de réservation** pour l'instant (pas de quota par
  membre, pas de condition de cotisation à jour).
