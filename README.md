# Budget Duo

Tableau de bord statique pour suivre un budget de couple, les factures, l'epargne et la projection du solde.

## Fonctionnalites

- solde actuel du foyer
- paies recurrentes
- factures recurrentes
- objectifs d'epargne
- objectifs d'epargne personnels ou communs
- mouvements ponctuels
- projection du compte sur plusieurs mois
- sauvegarde locale dans le navigateur
- import / export JSON
- mode cloud partage avec Supabase
- synchronisation quasi temps reel entre appareils

## Test public sur GitHub Pages

Le repo public peut etre deploye comme site statique GitHub Pages.

URL attendue apres activation:

- [https://sim14ch-habs.github.io/CODEX-Finance/](https://sim14ch-habs.github.io/CODEX-Finance/)

Pour l'activer sur GitHub:

1. Ouvre `Settings > Pages`.
2. Dans `Build and deployment`, choisis `Deploy from a branch`.
3. Selectionne la branche `main` et le dossier `/ (root)`.
4. Sauvegarde, puis attends quelques minutes que GitHub publie le site.

## Lancer localement

Ouvrez `index.html` dans votre navigateur.

## Publier sur GitHub Pages

1. Ajoutez les fichiers du projet a la racine du depot.
2. Ouvrez `Settings > Pages` sur GitHub.
3. Choisissez `Deploy from a branch`, puis `main` et `/ (root)`.
4. GitHub Pages generera ensuite l'URL du site.

## Note importante

Les donnees sont stockees via `localStorage`, donc elles restent dans le navigateur courant. Pour partager les donnees entre plusieurs appareils, utilisez l'export / import JSON ou ajoutez plus tard un backend.

## Donnees de demo

Tu peux aussi importer [demo-data.json](C:/Users/CASIMUN/OneDrive%20-%20ABB/Desktop/CODEX%20Finance/demo-data.json) depuis l'interface si tu veux tester rapidement avec un jeu de donnees.

## Activer la synchro cloud avec Supabase

Le site peut maintenant passer en mode partage en ligne.

### Ce que fait le mode cloud

- chaque personne se connecte avec son email
- la premiere personne cree le foyer cloud
- le site genere un code d'invitation
- la seconde personne se connecte puis rejoint le foyer avec ce code
- les changements du budget sont synchronises via Supabase Realtime
- l'epargne peut rester personnelle ou etre basculee sur un compte commun distinct

### Etapes de configuration

1. Cree un projet Supabase.
2. Dans `SQL Editor`, execute [supabase/setup.sql](C:/Users/CASIMUN/OneDrive%20-%20ABB/Desktop/CODEX%20Finance/supabase/setup.sql).
3. Dans `Authentication > URL Configuration`, ajoute comme `Site URL` et `Redirect URL`:
   - [https://sim14ch-habs.github.io/CODEX-Finance/](https://sim14ch-habs.github.io/CODEX-Finance/)
4. Recupere l'`URL` du projet et la `publishable key` dans `Project Settings > API`.
5. Remplis [supabase-config.js](C:/Users/CASIMUN/OneDrive%20-%20ABB/Desktop/CODEX%20Finance/supabase-config.js):
   - `url`
   - `anonKey`
   - `redirectUrl`
6. Commit et pousse ce fichier sur GitHub Pages.
7. Recharge le site: le panneau `Synchronisation en ligne` apparaitra en mode actif.

### Utilisation

1. Connecte-toi avec ton email depuis le site.
2. Clique sur `Creer le foyer cloud`.
3. Copie le code d'invitation affiche.
4. Ta conjointe se connecte sur son cell et entre ce code dans `Rejoindre le foyer`.
5. Une fois les deux appareils relies, les changements se propagent automatiquement.

### Remarques

- la `anonKey` Supabase est faite pour etre publique dans une application front-end
- la securite depend des policies SQL de [supabase/setup.sql](C:/Users/CASIMUN/OneDrive%20-%20ABB/Desktop/CODEX%20Finance/supabase/setup.sql)
- pour l'instant, l'application suppose qu'un utilisateur appartient a un seul foyer
