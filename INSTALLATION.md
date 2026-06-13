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
   **Membres** de l'application (fiche membre). Si la variable
   `SUPABASE_SERVICE_ROLE_KEY` est configurée dans Vercel (étape 4.3),
   l'administrateur peut créer le compte de connexion en même temps
   (champ « Identifiant » et « Mot de passe temporaire » dans le formulaire).
   À la première connexion, le membre est invité à personnaliser ses
   identifiants.

   Sans la clé service, créez le compte depuis **Authentication → Add
   user** avec le même email : la fiche et le compte se lient
   automatiquement.
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
| `LATITUDE` / `LONGITUDE` | Coordonnées de repli si un club n'en a pas |
| `FORMULES` | Tarifs et durées de vos baptêmes |

La clé `anon` est publique par conception : la sécurité repose sur les
règles RLS du schéma SQL, pas sur le secret de cette clé.

La clé **OpenWeatherMap n'est pas dans ce fichier** : elle est détenue
côté serveur par la fonction `/api/weather` (voir étape 4, variable
d'environnement Vercel). Elle n'est donc jamais exposée au navigateur.

Dès que `SUPABASE_URL` et `SUPABASE_ANON_KEY` sont renseignés, le mode
démonstration disparaît : connexions et données passent par Supabase.

## 4. Déployer sur Vercel

1. Créez un compte sur [vercel.com](https://vercel.com) (gratuit) et
   importez le dépôt GitHub du projet (**Add New → Project**).
2. Aucun réglage de build n'est nécessaire : **Deploy**. Vercel sert les
   pages statiques et exécute automatiquement la fonction `api/weather.js`.
3. **Activez la création de comptes membres** : dans **Settings →
   Environment Variables**, ajoutez deux variables pour les
   environnements *Production* et *Preview* :
   - `SUPABASE_URL` — la même URL que dans `config.js`
   - `SUPABASE_SERVICE_ROLE_KEY` — Supabase → Settings → API → clé
     `service_role` (**gardez-la secrète, jamais dans le code source**)

   Ces variables permettent à la fonction `/api/invite-member` de créer
   des comptes de connexion pour les membres directement depuis la page
   Membres (sans passer par le tableau de bord Supabase).

4. **Activez la météo réelle** : ajoutez également `OPENWEATHER_API_KEY`
   avec votre clé [openweathermap.org/api](https://openweathermap.org/api)
   (offre gratuite), puis redéployez (**Deployments → … → Redeploy**).
   La clé reste côté serveur, jamais exposée au navigateur.
5. Votre site est en ligne sur `https://votre-projet.vercel.app`.
   Chaque `git push` sur la branche principale redéploie automatiquement.
6. Optionnel : ajoutez un nom de domaine du club dans
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
- [ ] Page météo : conditions réelles du terrain (après ajout de la
      variable `OPENWEATHER_API_KEY` dans Vercel)

## Dépannage

- **« Mode démonstration » reste affiché** : vérifiez `SUPABASE_URL` et
  `SUPABASE_ANON_KEY` dans `assets/js/config.js`, puis videz le cache.
- **Connexion refusée pour un membre** : son compte existe-t-il dans
  Supabase → Authentication ? Sa fiche `profiles` est-elle `active` ?
- **« Conflit : la machine est déjà réservée »** : c'est le comportement
  attendu, le créneau chevauche une réservation non annulée.
- **Un membre voit le menu Baptêmes** : son rôle n'est pas `admin` ?
  Ce menu est réservé au bureau ; vérifiez sa fiche dans la page Membres.
