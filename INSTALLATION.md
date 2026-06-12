# Installation et mise en production

Ce guide couvre le passage du mode démonstration à une vraie mise en
service pour le club : base de données partagée, comptes réels, paiement
des baptêmes et météo.

Durée estimée : **30 à 45 minutes**. Aucune compétence serveur n'est
nécessaire, tout se fait depuis des interfaces web gratuites.

---

## 1. Créer la base de données (Supabase)

1. Créez un compte sur [supabase.com](https://supabase.com) (gratuit).
2. Créez un nouveau projet (région **West EU (Paris)** conseillée).
   Notez le mot de passe de base de données demandé à la création.
3. Une fois le projet prêt, ouvrez **SQL Editor → New query**, collez le
   contenu complet de [`supabase/schema.sql`](supabase/schema.sql) et
   cliquez sur **Run**. Cela crée les tables (membres, machines,
   réservations, cotisations, baptêmes) et les règles de sécurité.

   Le script crée aussi le **club fondateur Horizon Libre** (base LF3177
   Toulouse Nord Fronton). Les clubs suivants s'inscrivent directement
   en ligne via la page « Créer mon club ».

## 2. Créer le compte du bureau

1. Dans Supabase : **Authentication → Users → Add user**.
   Saisissez l'email et un mot de passe, cochez **Auto confirm**.
2. Rattachez ce compte au club fondateur avec le rôle administrateur.
   Dans **SQL Editor** :

   ```sql
   update profiles
   set role = 'admin',
       club_id = (select id from clubs where base_code = 'LF3177')
   where email = 'votre@email.fr';
   ```

3. Les autres membres se créent ensuite directement depuis la page
   **Membres** de l'application (fiche membre), et leur compte de
   connexion depuis **Authentication → Add user** avec le même email :
   la fiche et le compte se lient automatiquement au club.
4. **Important pour l'inscription des clubs en ligne** : dans
   **Authentication → Sign In / Up → Email**, désactivez **Confirm
   email**. Sinon, les fondateurs de nouveaux clubs devront confirmer
   leur email puis revenir se connecter avant de pouvoir créer le club
   (le flux le gère, mais c'est moins fluide).

## 3. Configurer l'application

Ouvrez `assets/js/config.js` et renseignez :

| Clé | Où la trouver |
|---|---|
| `SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | Supabase → Settings → API → clé `anon public` |
| `HELLOASSO_CAMPAIGN_URL` | URL de votre campagne HelloAsso (étape 5) |
| `OPENWEATHER_API_KEY` | [openweathermap.org/api](https://openweathermap.org/api), offre gratuite |
| `LATITUDE` / `LONGITUDE` | Coordonnées de votre terrain |
| `FORMULES` | Tarifs et durées de vos baptêmes |

La clé `anon` est publique par conception : la sécurité repose sur les
règles RLS du schéma SQL, pas sur le secret de cette clé.

Dès que `SUPABASE_URL` et `SUPABASE_ANON_KEY` sont renseignés, le mode
démonstration disparaît : connexions et données passent par Supabase.

## 4. Déployer sur Vercel

1. Créez un compte sur [vercel.com](https://vercel.com) (gratuit) et
   importez le dépôt GitHub du projet (**Add New → Project**).
2. Aucun réglage de build n'est nécessaire (site statique) : **Deploy**.
3. Votre site est en ligne sur `https://votre-projet.vercel.app`.
   Chaque `git push` sur la branche principale redéploie automatiquement.
4. Optionnel : ajoutez un nom de domaine du club dans
   **Settings → Domains**.

## 5. Paiement des baptêmes (HelloAsso)

1. Créez le compte de l'association sur
   [helloasso.com](https://www.helloasso.com) (gratuit, justificatifs
   d'association demandés).
2. Créez une campagne de type **Vente** ou **Billetterie** avec un tarif
   par formule (Découverte, Sensation, Prestige).
3. Copiez l'URL publique de la campagne dans `HELLOASSO_CAMPAIGN_URL`
   (fichier `assets/js/config.js`).

Fonctionnement : le client remplit le formulaire public (la demande
apparaît « en attente » dans le back-office), puis paie sur HelloAsso.
Le bureau rapproche le paiement reçu (email HelloAsso) de la demande,
saisit la référence et passe le statut à « Payé ».

## 6. Vérifications finales

- [ ] Connexion avec le compte bureau → le menu « Baptêmes » est visible
- [ ] Création d'une machine et d'un membre de test
- [ ] Réservation d'un créneau avec le membre de test, validation avec le
      compte bureau, clôture du vol → les heures s'ajoutent à la machine
- [ ] Demande de baptême depuis la page publique (navigation privée,
      sans connexion) → elle apparaît dans le back-office
- [ ] Page météo avec la clé OpenWeatherMap

## Dépannage

- **« Mode démonstration » reste affiché** : vérifiez `SUPABASE_URL` et
  `SUPABASE_ANON_KEY` dans `assets/js/config.js`, puis videz le cache.
- **Connexion refusée pour un membre** : son compte existe-t-il dans
  Supabase → Authentication ? Sa fiche `profiles` est-elle `active` ?
- **« Conflit : la machine est déjà réservée »** : c'est le comportement
  attendu, le créneau chevauche une réservation non annulée.
- **Un membre voit le menu Baptêmes** : son rôle n'est pas `admin` ?
  Ce menu est réservé au bureau ; vérifiez sa fiche dans la page Membres.
