# Guide synchro cloud

Voici le resume utile si tu veux reconnecter le budget partage sans relire toute la conversation.

## Etat actuel

- Site public: [https://sim14ch-habs.github.io/CODEX-Finance/](https://sim14ch-habs.github.io/CODEX-Finance/)
- Supabase est deja configure dans le site
- Le SQL setup a deja ete execute
- Les URLs d'authentification Supabase pointent vers le bon site GitHub Pages

## Comment connecter ta conjointe

1. Sur ton appareil, ouvre le panneau `Synchronisation en ligne`.
2. Recupere le `Code d'invitation` affiche dans le foyer cloud.
3. Sur le cell de ta conjointe, ouvre le site:
   [https://sim14ch-habs.github.io/CODEX-Finance/](https://sim14ch-habs.github.io/CODEX-Finance/)
4. Dans `Connexion par email`, elle entre son email et clique sur `Envoyer le lien`.
5. Elle ouvre le courriel recu et clique sur le lien magique de connexion.
6. Une fois revenue sur le site, elle colle ton `Code d'invitation` dans `Rejoindre le foyer`.
7. Si besoin, elle clique ensuite sur `Recharger depuis le cloud`.

## Important

- Ne pas cliquer sur `Envoyer mon budget local` avant d'avoir rejoint le foyer, sinon un budget local vide pourrait ecraser l'etat cloud.
- Si le site semble vide, tester en navigateur prive ou faire un rafraichissement force.
- Les changements entre appareils devraient ensuite se synchroniser presque en temps reel.

## Si quelque chose bloque

Verifier dans l'ordre:

1. Le bon email a ete utilise.
2. Le lien magique du courriel ouvre bien le site GitHub Pages.
3. Le `Code d'invitation` est exactement le bon.
4. Le bouton `Recharger depuis le cloud` a ete teste apres la connexion.

## Commit de configuration

- Commit Supabase config: `5b05dd2`
