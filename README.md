# Budget Duo

Tableau de bord statique pour suivre un budget de couple, les factures, l'epargne et la projection du solde.

## Fonctionnalites

- solde actuel du foyer
- paies recurrentes
- factures recurrentes
- objectifs d'epargne
- mouvements ponctuels
- projection du compte sur plusieurs mois
- sauvegarde locale dans le navigateur
- import / export JSON

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
