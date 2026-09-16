# Comprendre le code

Ce document explique le fonctionnement du prototype, étape par étape. Il sert aussi à préparer l'entretien.

## Vue d'ensemble : qui fait quoi ?

| Fichier | Rôle | En une phrase |
|---|---|---|
| `index.html` | **Le contenu** | Les 3 écrans et les 10 questions, avec les points de chaque réponse et les textes du résultat |
| `css/styles.css` | **Le design** | Couleurs, cartes, boutons, mise en page mobile et ordinateur |
| `js/score.js` | **Le calcul** | Lit les réponses cochées, calcule les scores et remplit l'écran de résultat |
| `js/app.js` | **La navigation** | Affiche le bon écran et la bonne question, vérifie les réponses, sauvegarde |

**Ordre de chargement :** `score.js` est chargé **avant** `app.js`, car `app.js` utilise ses fonctions (`getQuestionScore`, `calculateResults`, `displayResults`).

---

## 1. `index.html` : tout le contenu est dans le HTML

### Les 3 écrans
Ce sont 3 blocs `<div class="screen">`. Un seul est visible à la fois : les autres portent l'attribut **`hidden`**.

```html
<div id="screen-intro" class="screen">...</div>
<div id="screen-questions" class="screen" hidden>...</div>
<div id="screen-result" class="screen" hidden>...</div>
```

Pour changer d'écran, le JavaScript ajoute ou retire simplement `hidden`.

### Une question
Chaque question est un `<fieldset class="question">`. Toutes ses informations sont dans des **attributs `data-*`** :

```html
<fieldset class="question"
  data-dimension="formalisation"   ← sa dimension
  data-weight="3"                  ← son importance (1 à 3)
  data-readiness="2"               ← son poids dans « Préparation au financement »
  data-strength="Votre entreprise a une existence légale reconnue."
  data-weakness="L’absence d’enregistrement légal ferme l’accès…"
  data-action-title="Formaliser votre activité"
  data-action-text="Enregistrez l’entreprise au RCCM…">

  <legend>…titre de la question…</legend>

  <label class="option">
    <input type="radio" name="legal_status" value="75">   ← value = nombre de points
    <span class="option-indicator"></span>
    <span>Entreprise individuelle enregistrée au RCCM</span>
  </label>
  …
</fieldset>
```

**Idée clé : `value` contient directement les points de la réponse.** Pour modifier un barème, il suffit de changer ce nombre dans le HTML.

### Les types de questions
| Type | Balise | Exemple |
|---|---|---|
| Choix unique / tranche | `<input type="radio">` (même `name` = une seule réponse possible) | Questions 1, 3, 4, 5, 6, 9 |
| Choix multiple | `<input type="checkbox">` | Questions 2 et 8 |
| Valeur numérique | `<input type="number" min="0" max="240">` | Question 7 |
| Échelle | 5 `<input type="radio">` affichés comme des cases 1 à 5 | Question 10 |

### L'écran de résultat
Il est déjà écrit en HTML, avec des zones vides repérées par un `id` (`global-score`, `strengths-list`, `actions-list`…). `score.js` remplit ces zones.

---

## 2. `css/styles.css` : les techniques utilisées

- **Variables CSS** (`--color-brand`, `--level-fragile`…) en haut du fichier : on change une couleur à un seul endroit.
- **Mobile d'abord** : les styles de base visent un téléphone, puis `@media (min-width: 640px)` adapte l'affichage aux grands écrans.
- **Réponses en forme de carte** : le vrai `<input>` est rendu invisible (`opacity: 0`), mais il reste utilisable au clavier. On dessine un rond ou une case à côté (`.option-indicator`). La carte sélectionnée est colorée grâce à `.option:has(input:checked)`.
- **Cercle du score sans image** :
  ```css
  background: conic-gradient(var(--level-color) calc(var(--score) * 1%), var(--color-border) 0);
  ```
  C'est un disque coloré jusqu'à `--score` %. Un rond blanc (`::before`) posé au centre le transforme en anneau. `score.js` donne la valeur avec `hero.style.setProperty('--score', 52)`.
- **Couleur selon le niveau** : `score.js` ajoute une classe (`level-fragile`, `level-ready`…), et chaque classe définit `--level-color`.
- **`[hidden] { display: none !important; }`** : garantit qu'un écran caché reste caché, même si sa classe lui donne `display: flex`.
- **Impression** : `@media print` cache les boutons pour que « Enregistrer en PDF » donne un document propre.

---

## 3. `js/app.js` : la navigation

Deux variables retiennent l'état : `currentIndex` (question affichée) et `isFinished` (résultat déjà vu).

| Fonction | Ce qu'elle fait |
|---|---|
| `showScreen(name)` | Affiche un écran et cache les deux autres (`hidden`) |
| `showQuestion(index)` | Affiche la question n° `index`, met à jour « Question X sur 10 » et la largeur de la barre |
| `showResult()` | Vérifie que tout est répondu, appelle le calcul, affiche le résultat |
| `getErrorMessage(question)` | Choisit le bon message d'erreur selon le type de question |
| `handleExclusiveCheckbox(input)` | Décoche les autres cases quand on coche « Aucun de ces documents » (et inversement) |
| `saveProgress()` / `loadProgress()` | Enregistre ou relit les réponses dans le `localStorage` |
| `updateResumePanel()` | Affiche « Reprendre où j'en étais » s'il existe une sauvegarde |
| `restart()` | Efface tout et revient à l'accueil |

### Le déroulement d'un clic sur « Suivant »
```
Clic « Suivant »
  → le formulaire envoie l'événement « submit »
  → event.preventDefault()          (la page ne se recharge pas)
  → getQuestionScore(question) === null ?
        oui → affiche le message d'erreur, on reste sur la question
        non → showQuestion(currentIndex + 1), ou showResult() à la dernière question
```

Le bouton « Suivant » est un `type="submit"`. La touche **Entrée** fonctionne donc aussi, par exemple après avoir tapé un nombre.

### La sauvegarde
```js
const values = Array.from(form.querySelectorAll('input')).map((input) =>
  input.type === 'number' ? input.value : input.checked
);
```
On enregistre, **dans l'ordre de la page**, l'état de chaque champ : `true` ou `false` pour une case, le texte pour le nombre. Au chargement, on remet chaque champ dans cet état.

Le `try { … } catch` protège contre les navigateurs qui bloquent le stockage (navigation privée). Dans ce cas, le diagnostic fonctionne quand même, sans sauvegarde.

---

## 4. `js/score.js` : le calcul

### Score d'une question : `getQuestionScore(question)`
- **Nombre** → `getHistoryScore()` le convertit par paliers : 0 mois → 0, 1 à 5 → 35, 6 à 11 → 70, 12 et plus → 100.
- **Cases cochées** → addition des `value` des réponses cochées, avec un maximum de 100. Pour un bouton radio, une seule réponse est cochée : le total est donc sa valeur.
- **Rien de coché** → `null`, ce qui veut dire « pas de réponse ».

### Résultat complet : `calculateResults(questions)`
1. Pour chaque dimension, on additionne `score × poids`, puis on divise par la somme des poids.
2. **Règle** : si la réponse « même caisse » (`money_separation`, `value="0"`) est cochée, la Finance est ramenée à 50 maximum.
3. Score global = Formalisation × 0,3 + Finance × 0,4 + Digitalisation × 0,3.
4. Points forts (≥ 70), points faibles (< 50), actions (< 70) triées par **priorité = (100 − score) × poids**.
5. Indicateur financement : même principe, avec les poids `data-readiness`.

### Exemple calculé à la main
Formalisation : entreprise individuelle (75 points, poids 3), RCCM + IFU (25 + 25 = 50 points, poids 2), séparation partielle (40 points, poids 3).

```
Formalisation = (75×3 + 50×2 + 40×3) / (3 + 2 + 3) = 445 / 8 = 55,6 → 56
```

Avec Finance = 50 et Digitalisation = 50 :

```
Global = 56×0,3 + 50×0,4 + 50×0,3 = 16,8 + 20 + 15 = 51,8 → 52/100 → « En structuration »
```

### Affichage : `displayResults(result, companyName)`
Remplit les zones du HTML : `textContent` pour les textes, `style.width` pour les barres, `className` pour la couleur du niveau. Les listes (points forts, actions) sont créées avec `document.createElement` et **`textContent`**, jamais `innerHTML` : un texte ne peut donc pas être exécuté comme du code.

---

## 5. Questions probables en entretien

**Pourquoi pas React ?**
Trois écrans et un calcul simple ne justifient pas un framework. La consigne demande une technologie réellement maîtrisée, et le public mobile d'ALODO bénéficie d'une page légère sans bibliothèque à télécharger.

**Pourquoi mettre les points dans le HTML ?**
Tout le questionnaire se lit à un seul endroit, et modifier un barème ne demande pas de toucher au JavaScript. Le JavaScript est générique : il additionne les `value` cochées, quelle que soit la question.

**Comment ajouter une question ?**
Copier un `<fieldset class="question">` dans `index.html`, puis changer le texte, les `value`, `data-dimension`, `data-weight` et les textes `data-*`. Le JavaScript la prend en compte automatiquement. Il faut seulement mettre à jour le « 10 » écrit en dur dans les textes de l'accueil et dans `aria-valuemax`.

**Pourquoi la Finance pèse 40 % ?**
C'est la dimension la plus liée à la capacité d'obtenir un financement. Les poids sont un choix raisonné, à calibrer ensuite sur des données réelles.

**Pourquoi plafonner la Finance quand l'argent est mélangé ?**
Si la caisse de l'entreprise sert aussi aux dépenses de la famille, le « bénéfice » déclaré ne veut rien dire. Le plafond évite un score trompeur, et l'écran de résultat l'explique.

**Que se passe-t-il si on tape 999 mois ?**
`getHistoryScore` renvoie `null` (valeur hors limites). La question est donc considérée sans réponse et le message « Entrez un nombre entier entre 0 et 240 » s'affiche.

**Et si le localStorage est bloqué ?**
Le `try/catch` attrape l'erreur. Le diagnostic fonctionne normalement, seule la reprise après fermeture n'est pas possible.

**Comment passer à un vrai backend ?**
Dans `saveProgress()` et `loadProgress()`, remplacer `localStorage` par un appel `fetch()` vers une API. Le reste du code ne change pas.
