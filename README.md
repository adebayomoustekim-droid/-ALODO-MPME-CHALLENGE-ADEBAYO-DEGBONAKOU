# Diagnostic ALODO MPME — prototype

> Exercice de sélection ALODO TECH · Profil Développeur
> Candidat : **Adebayo Degbonakou**

**Démo en ligne :** `https://<utilisateur-github>.github.io/ALODO-MPME-CHALLENGE-ADEBAYO-DEGBONAKOU/`
---

## 1. Présentation

J'ai construit un **prototype fonctionnel du diagnostic ALODO MPME**, pensé pour être utilisé sur téléphone par un dirigeant de MPME.

Il suit le parcours demandé en trois écrans :

| Écran | Contenu |
|---|---|
| **Introduction** | Objectif, durée (≈ 5 min), les 3 dimensions évaluées et pourquoi, place du diagnostic dans le programme ALODO MPME, reprise d'un diagnostic en cours |
| **Questions** | 10 questions, une par écran, avec « Question 4 sur 10 », une barre de progression et la dimension en cours (« Finance · 1/4 ») |
| **Résultat** | Score global /100 et niveau de maturité, score par dimension, phrase de synthèse, points forts, points à améliorer, **3 actions prioritaires concrètes**, indicateur « Préparation au financement », partage WhatsApp, export PDF |

## 2. Choix produit

### Pourquoi ces 3 dimensions : Formalisation, Finance, Digitalisation

En étudiant ALODO TECH (boîtier IoT pour les transactions en espèces, intégration WhatsApp, scoring de crédit MPME), j'ai compris que le fil conducteur est de **transformer l'activité informelle en données fiables pour ouvrir l'accès au financement**.

J'ai donc choisi les trois dimensions qui conditionnent ce passage :

- **Formalisation** : sans existence légale ni séparation des comptes, aucune donnée financière n'est exploitable, et aucune banque ne peut prêter.
- **Finance** : ce que l'entreprise sait (ou non) de ses propres chiffres. C'est la base de toute décision et de tout dossier de crédit.
- **Digitalisation** : chaque paiement Mobile Money ou échange WhatsApp laisse une **trace**. C'est exactement la matière première du scoring ALODO.

Ces trois dimensions forment une chaîne cohérente : **se formaliser → mesurer → tracer**. Elles préparent naturellement la 8ᵉ dimension, *Préparation au financement*, que j'ai choisi de **calculer à partir des réponses existantes** plutôt que d'ajouter des questions.

**Volontairement écartées :** Commercial, Opérations et RH sont importantes, mais dépendent fortement du secteur et de la taille de l'entreprise. Elles relèvent d'un parcours adaptatif (voir [la réflexion produit](docs/REFLEXION-PRODUIT.md)). La Comptabilité est en partie couverte par les questions Finance (fréquence d'enregistrement, historique), sans jargon comptable.

### Pourquoi ces questions

Chaque question a été choisie selon trois critères :

1. **Compréhensible par un micro-entrepreneur**, sans jargon : « Si vos ventes s'arrêtaient demain, combien de temps pourriez-vous payer vos charges ? » plutôt que « Quel est votre besoin en fonds de roulement ? ».
2. **Révélatrice d'une pratique réelle**, pas d'un équipement : on ne demande pas « avez-vous un site web ? », mais « comment utilisez-vous WhatsApp pour vendre ? ».
3. **Adaptée au contexte béninois** : RCCM, IFU, CNSS, APIEx, MTN MoMo, Moov Money, Celtiis Cash, WhatsApp Business.

| # | Dimension | Question | Type |
|---|---|---|---|
| 1 | Formalisation | Situation juridique | Choix unique |
| 2 | Formalisation | Documents administratifs à jour | Choix multiple |
| 3 | Formalisation | Séparation argent pro / perso | Choix unique |
| 4 | Finance | Fréquence d'enregistrement des ventes et dépenses | Choix unique |
| 5 | Finance | Connaissance du bénéfice mensuel | Choix unique |
| 6 | Finance | Autonomie de trésorerie | Tranche |
| 7 | Finance | Mois d'historique de ventes vérifiable | Valeur numérique |
| 8 | Digitalisation | Moyens de paiement acceptés | Choix multiple |
| 9 | Digitalisation | Usage de WhatsApp et d'Internet pour vendre | Choix unique |
| 10 | Digitalisation | Part de la gestion faite sur outil numérique | Échelle 1 à 5 |

Aucune question ne porte sur la **taille** de l'entreprise (chiffre d'affaires, effectif) : le score mesure la **maturité**, pas la taille. Une micro-entreprise bien tenue doit pouvoir obtenir un excellent score.

### Logique de scoring

1. **Chaque réponse vaut de 0 à 100 points**, écrits directement dans le HTML (`value="75"`). Un choix multiple additionne les réponses cochées (100 au maximum). L'historique de ventes est converti par paliers (0 mois → 0, 1-5 → 35, 6-11 → 70, 12 et plus → 100).
2. **Score d'une dimension** = moyenne pondérée de ses questions. Le poids va de 1 à 3 selon l'importance de la question (`data-weight`). Par exemple, la séparation pro/perso pèse 3 et la connaissance du bénéfice pèse 2.
3. **Règle de cohérence** : si l'argent personnel et professionnel est totalement mélangé, le score Finance est **plafonné à 50**, et le résultat explique pourquoi. Des chiffres financiers « bien suivis » n'ont pas de sens si l'on ne sait pas quel argent appartient à l'entreprise.
4. **Score global** = moyenne pondérée des dimensions : Finance 40 %, Formalisation 30 %, Digitalisation 30 %. La finance pèse plus, car c'est le cœur de la finançabilité.
5. **Niveaux** : 0-39 *Fragile* · 40-59 *En structuration* · 60-79 *Structurée* · 80-100 *Prête à croître*.
6. **Points forts** : réponses ≥ 70. **Points faibles** : réponses < 50. **Actions prioritaires** : triées par `(100 − score) × poids`, pour traiter d'abord ce qui a le plus d'impact. Même un très bon profil reçoit au moins un point de vigilance.
7. **Indicateur « Préparation au financement »** : moyenne pondérée de 5 réponses déjà données (statut légal, documents, séparation des comptes, historique de ventes, paiements), repérées par l'attribut `data-readiness`. Il est affiché à part et **n'entre pas dans le score global**.

> **Exemple (vérifié) :** entreprise individuelle, RCCM + IFU, séparation partielle, suivi hebdomadaire, bénéfice approximatif, 1 à 4 semaines de trésorerie, 3 mois d'historique, espèces + Mobile Money, WhatsApp Business, échelle 2/5
> → Formalisation **56** · Finance **50** · Digitalisation **50** → **Score global 52/100, « En structuration »**.

## 3. Choix techniques

**HTML + CSS, avec un peu de JavaScript simple. Aucun framework, aucune installation.**

| Choix | Raison |
|---|---|
| **HTML et CSS en premier** | C'est la technologie que je maîtrise, conformément à la consigne (« une solution simple et maîtrisée »). Les 3 écrans et les 10 questions sont écrits directement dans `index.html` : on peut lire tout le questionnaire sans lire de code. |
| **Le JavaScript limité au nécessaire** | HTML et CSS ne savent pas calculer. Deux petits fichiers commentés gèrent le passage d'un écran à l'autre, la progression, le calcul du score et la sauvegarde. |
| **Les barèmes et les textes dans le HTML** (`value`, `data-weight`, `data-strength`…) | Changer un barème ou une recommandation se fait dans le HTML, sans toucher au JavaScript. |
| **Page légère, sans police ni bibliothèque externe** | Le public d'ALODO est majoritairement sur mobile, souvent avec une connexion lente ou un forfait limité. |
| **Vrais éléments de formulaire** (`<fieldset>`, `<legend>`, `<input type="radio">`, `<label>`) | Accessibles au clavier et aux lecteurs d'écran. La carte entière de chaque réponse est cliquable. |
| **localStorage** | Une coupure réseau ou un appel ne font pas perdre les réponses. Rien n'est envoyé sur Internet. |
| **Cercle du score en CSS pur** (`conic-gradient`) | Pas d'image ni de bibliothèque de graphiques. |

**Mobile d'abord :** zones tactiles de 52 px, boutons « Précédent / Suivant » fixés en bas de l'écran, clavier numérique pour les nombres, textes en 16 px minimum (pas de zoom automatique sur iPhone), mise en page élargie à partir de 640 px.

### Structure du projet

```
├── index.html          Les 3 écrans et les 10 questions (avec leurs points et leurs textes)
├── css/
│   └── styles.css      Tout le design, mobile d'abord
├── js/
│   ├── score.js        Calcul du score et remplissage de l'écran de résultat
│   └── app.js          Navigation, progression, validation, sauvegarde
└── docs/
    ├── REFLEXION-PRODUIT.md    Bonus : propositions d'amélioration
    ├── COMPRENDRE-LE-CODE.md   Fonctionnement du code, étape par étape
    └── GUIDE-GIT.md            Historique Git et publication
```

## 4. Installation

Aucune installation n'est nécessaire.

1. Télécharger ou cloner le projet :
   ```bash
   git clone https://github.com/<utilisateur-github>/ALODO-MPME-CHALLENGE-ADEBAYO-DEGBONAKOU.git
   ```
2. Ouvrir **`index.html`** dans un navigateur (double-clic).

Pour tester sur téléphone : utiliser le lien de la démo en ligne, ou l'extension « Live Server » de VS Code (clic droit sur `index.html` → *Open with Live Server*), puis ouvrir l'adresse affichée depuis un téléphone connecté au même Wi-Fi.

## 5. Fonctionnalités

-  Parcours complet Introduction → 10 questions → Résultat
-  5 types de questions : choix unique, choix multiple (avec option exclusive « Aucun »), tranche, valeur numérique (avec choix rapides), échelle
-  Progression toujours visible : numéro de question, barre de progression, dimension en cours
-  Validation avec messages clairs (réponse manquante, nombre hors limites)
-  Retour à la question précédente, modification des réponses depuis le résultat
-  Sauvegarde automatique et reprise d'un diagnostic interrompu
-  Score global et par dimension, niveau de maturité, phrase de synthèse
-  Points forts, points à améliorer, 3 actions prioritaires classées par impact
-  Règle de cohérence (plafond Finance) expliquée à l'utilisateur
-  Indicateur « Préparation au financement »
-  Partage du résultat sur WhatsApp, export PDF via l'impression
-  Responsive mobile / tablette / ordinateur, utilisable au clavier

## 6. Limites (choix volontaires)

- **5 dimensions sur 8 non couvertes** (Commercial, Opérations, RH, Comptabilité en détail, Préparation au financement en questionnaire), pour respecter le périmètre.
- **Réponses déclaratives** : rien n'est vérifié, et le résultat est présenté comme indicatif.
- **Pas de backend ni de compte** : les réponses restent sur l'appareil, et l'équipe ALODO ne peut pas les consulter.
- **Barèmes et poids fixés par raisonnement**, pas encore calibrés sur des données réelles de MPME.
- **Parcours identique pour toutes les entreprises** : pas encore d'adaptation au secteur ou à la taille.
- **Pas de tests automatisés** : le parcours et les calculs ont été vérifiés à la main (voir l'exemple ci-dessus).
- **Français uniquement.**

## 7. Améliorations avec plus de temps

1. **Diagnostic adaptatif** : quelques questions de profil (secteur, effectif, statut) orientent vers les bonnes questions (stock pour le commerce, RH au-delà de 10 salariés…).
2. **Indice de confiance** : distinguer une réponse déclarée d'une réponse prouvée (photo du cahier, relevé Mobile Money, données du boîtier ALODO).
3. **Backend léger** (API + base de données) pour que l'équipe ALODO suive la cohorte de 20 MPME et prépare l'analyse et le rapport.
4. **Diagnostic sur WhatsApp**, là où les dirigeants sont déjà.
5. **Nouveau diagnostic à 3 et 6 mois** pour mesurer l'impact de l'accompagnement.
6. **Langues locales et questions audio** (fon, yoruba…) pour les dirigeants peu à l'aise à l'écrit.
7. **Tests automatisés** du calcul du score, et **calibrage des barèmes** avec les conseillers ALODO.

Détails et schéma : **[docs/REFLEXION-PRODUIT.md](docs/REFLEXION-PRODUIT.md)**.

---

## Utilisation de l'IA

Ce projet a été réalisé avec l'aide d'un assistant IA (Claude, d'Anthropic) pour la problématique  du sujet, du code et de la documentation. Les choix produit (périmètre, questions, logique de scoring) ont été discutés, relus et validés, et j'ai relu l'ensemble du code pour pouvoir l'expliquer. Le fonctionnement détaillé est documenté dans [docs/COMPRENDRE-LE-CODE.md](docs/COMPRENDRE-LE-CODE.md).
#   - A L O D O - M P M E - C H A L L E N G E - A D E B A Y O - D E G B O N A K O U  
 