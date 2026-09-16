/* =========================================================================
   score.js — Calcul du score et affichage de l'écran de résultat

   Les points de chaque réponse sont écrits dans index.html (attribut value),
   ainsi que les textes (data-strength, data-weakness, data-action-...).
   Ce fichier ne fait que lire ces informations, calculer, puis afficher.
   ========================================================================= */

// Les 3 dimensions et leur poids dans le score global (total = 1)
const DIMENSIONS = {
  formalisation: { label: 'Formalisation', weight: 0.3 },
  finance: { label: 'Finance', weight: 0.4 },
  digitalisation: { label: 'Digitalisation', weight: 0.3 },
};

// Niveaux de maturité, du plus haut au plus bas
const LEVELS = [
  { min: 80, name: 'Prête à croître', className: 'level-ready' },
  { min: 60, name: 'Structurée', className: 'level-structured' },
  { min: 40, name: 'En structuration', className: 'level-building' },
  { min: 0, name: 'Fragile', className: 'level-fragile' },
];

const STRENGTH_MIN = 70; // à partir de ce score, une réponse est un point fort
const WEAKNESS_MAX = 50; // en dessous de ce score, une réponse est un point faible
const FINANCE_CAP = 50;  // plafond Finance si l'argent perso et pro est mélangé


/* ---------- 1. Score d'une question (de 0 à 100, ou null si pas de réponse) ---------- */

function getQuestionScore(question) {
  // Question avec un nombre : on convertit les mois en points
  const numberInput = question.querySelector('input[type="number"]');
  if (numberInput) {
    return getHistoryScore(numberInput.value);
  }

  // Questions à cocher : on additionne les points des réponses cochées
  const checkedInputs = question.querySelectorAll('input:checked');
  if (checkedInputs.length === 0) {
    return null;
  }
  let total = 0;
  checkedInputs.forEach((input) => {
    total += Number(input.value);
  });
  return Math.min(total, 100);
}

// Historique de ventes : 0 mois → 0 pt, 1 à 5 → 35, 6 à 11 → 70, 12 et plus → 100
function getHistoryScore(value) {
  if (value === '') return null;
  const months = Number(value);
  if (!Number.isInteger(months) || months < 0 || months > 240) return null;
  if (months === 0) return 0;
  if (months <= 5) return 35;
  if (months <= 11) return 70;
  return 100;
}

function getLevel(score) {
  return LEVELS.find((level) => score >= level.min);
}


/* ---------- 2. Calcul du résultat complet ---------- */

function calculateResults(questions) {
  const answers = [];
  const totals = {}; // ex. : { finance: { points: 495, weights: 10 } }

  questions.forEach((question) => {
    const answer = {
      question: question,
      score: getQuestionScore(question),
      weight: Number(question.dataset.weight),
      dimension: question.dataset.dimension,
    };
    answers.push(answer);

    if (!totals[answer.dimension]) {
      totals[answer.dimension] = { points: 0, weights: 0 };
    }
    totals[answer.dimension].points += answer.score * answer.weight;
    totals[answer.dimension].weights += answer.weight;
  });

  // Score d'une dimension = moyenne pondérée de ses questions
  const dimensionScores = {};
  for (const id in DIMENSIONS) {
    dimensionScores[id] = Math.round(totals[id].points / totals[id].weights);
  }

  // Règle de cohérence : argent mélangé → les chiffres financiers ne sont pas fiables
  const moneyInput = document.querySelector('input[name="money_separation"][value="0"]');
  const moneyMixed = moneyInput ? moneyInput.checked : false;
  if (moneyMixed) {
    dimensionScores.finance = Math.min(dimensionScores.finance, FINANCE_CAP);
  }

  // Score global = moyenne pondérée des dimensions
  let globalScore = 0;
  for (const id in DIMENSIONS) {
    globalScore += dimensionScores[id] * DIMENSIONS[id].weight;
  }
  globalScore = Math.round(globalScore);

  // Priorité d'une amélioration : grand écart à 100 × question importante
  const byPriority = (a, b) => (100 - b.score) * b.weight - (100 - a.score) * a.weight;

  const strengths = answers
    .filter((answer) => answer.score >= STRENGTH_MIN)
    .sort((a, b) => b.score * b.weight - a.score * a.weight)
    .slice(0, 3);

  let weaknesses = answers.filter((answer) => answer.score < WEAKNESS_MAX).sort(byPriority).slice(0, 3);
  // Même un très bon profil garde un point de vigilance : sa réponse la plus basse
  if (weaknesses.length === 0) {
    weaknesses = answers.filter((answer) => answer.score < 100).sort(byPriority).slice(0, 1);
  }

  const actions = answers.filter((answer) => answer.score < STRENGTH_MIN).sort(byPriority).slice(0, 3);

  // Indicateur « Préparation au financement » : questions qui ont un attribut data-readiness
  let readinessPoints = 0;
  let readinessWeights = 0;
  answers.forEach((answer) => {
    const weight = Number(answer.question.dataset.readiness || 0);
    readinessPoints += answer.score * weight;
    readinessWeights += weight;
  });
  const readinessScore = Math.round(readinessPoints / readinessWeights);

  return {
    globalScore: globalScore,
    level: getLevel(globalScore),
    summary: buildSummary(dimensionScores),
    dimensionScores: dimensionScores,
    moneyMixed: moneyMixed,
    strengths: strengths,
    weaknesses: weaknesses,
    actions: actions,
    readinessScore: readinessScore,
  };
}

// Phrase de synthèse : met en avant la meilleure et la plus faible dimension
function buildSummary(dimensionScores) {
  const ids = Object.keys(DIMENSIONS).sort((a, b) => dimensionScores[b] - dimensionScores[a]);
  const best = ids[0];
  const worst = ids[ids.length - 1];
  const bestLabel = DIMENSIONS[best].label.toLowerCase();
  const worstLabel = DIMENSIONS[worst].label.toLowerCase();

  if (dimensionScores[best] - dimensionScores[worst] < 10) {
    const average = (dimensionScores[best] + dimensionScores[worst]) / 2;
    return `Profil équilibré : ${describeMaturity(average)} sur les 3 dimensions.`;
  }
  if (dimensionScores[best] < 40) {
    return `Les fondations restent à poser, en commençant par la ${worstLabel}.`;
  }
  const text = `${describeMaturity(dimensionScores[best])} en ${bestLabel}, mais ${worstLabel} à renforcer en priorité.`;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function describeMaturity(score) {
  if (score >= 80) return 'très bonne maturité';
  if (score >= 60) return 'bonne maturité';
  if (score >= 40) return 'maturité en progression';
  return 'des bases à construire';
}

function getReadinessStatus(score) {
  if (score >= 70) return 'Dossier présentable';
  if (score >= 40) return 'Dossier à consolider';
  return 'Prématuré pour un crédit';
}


/* ---------- 3. Affichage du résultat ---------- */

function displayResults(result, companyName) {
  // Score global et niveau
  const hero = document.getElementById('score-hero');
  hero.className = 'score-hero ' + result.level.className;
  hero.style.setProperty('--score', result.globalScore); // utilisé par le cercle en CSS

  document.getElementById('result-company').textContent = companyName || 'Votre entreprise';
  document.getElementById('score-circle-value').textContent = result.globalScore;
  document.getElementById('global-score').textContent = result.globalScore + '/100';
  document.getElementById('level-badge').textContent = result.level.name;
  document.getElementById('result-summary').textContent = result.summary;

  // Barres par dimension
  for (const id in DIMENSIONS) {
    const score = result.dimensionScores[id];
    const level = getLevel(score);
    const row = document.getElementById('dim-' + id);
    row.className = 'dimension-bar ' + level.className;
    row.querySelector('.dimension-bar-score strong').textContent = score;
    row.querySelector('.bar-fill').style.width = score + '%';
    row.querySelector('.dimension-bar-level').textContent = level.name;
  }
  document.getElementById('finance-alert').hidden = !result.moneyMixed;

  // Points forts, points faibles, actions
  fillFindings('strengths-list', result.strengths, 'data-strength', '✓',
    'Pas encore de point fort marqué : c’est fréquent en début de structuration, et chaque action ci-dessous en créera un.');
  fillFindings('weaknesses-list', result.weaknesses, 'data-weakness', '!',
    'Aucun point faible détecté sur ce périmètre : l’enjeu est de maintenir ce niveau en grandissant.');
  fillActions(result.actions);

  // Indicateur financement
  document.getElementById('readiness-score').textContent = result.readinessScore;
  document.getElementById('readiness-status').textContent = getReadinessStatus(result.readinessScore);

  // Lien de partage WhatsApp
  const shareText = [
    'Diagnostic ALODO MPME' + (companyName ? ' — ' + companyName : ''),
    `Score global : ${result.globalScore}/100 (${result.level.name})`,
    `Formalisation : ${result.dimensionScores.formalisation} · Finance : ${result.dimensionScores.finance} · Digitalisation : ${result.dimensionScores.digitalisation}`,
    result.summary,
  ].join('\n');
  const btnShare = document.getElementById('btn-share');
  if (btnShare) {
    btnShare.href = 'https://wa.me/?text=' + encodeURIComponent(shareText);
  }
}

// Crée un élément avec une classe et un texte.
// textContent (et non innerHTML) : un texte saisi ne peut jamais être exécuté comme du code.
function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function fillFindings(listId, answers, textAttribute, icon, emptyText) {
  const list = document.getElementById(listId);
  list.innerHTML = ''; // on vide la liste (aucun texte utilisateur ici)

  if (answers.length === 0) {
    list.appendChild(createElement('li', 'empty-text', emptyText));
    return;
  }
  answers.forEach((answer) => {
    const item = createElement('li', 'finding');
    const content = createElement('div');
    item.appendChild(createElement('span', 'finding-icon', icon));
    content.appendChild(createElement('p', 'finding-text', answer.question.getAttribute(textAttribute)));
    content.appendChild(createElement('p', 'finding-dimension', DIMENSIONS[answer.dimension].label));
    item.appendChild(content);
    list.appendChild(item);
  });
}

function fillActions(answers) {
  const list = document.getElementById('actions-list');
  list.innerHTML = '';

  if (answers.length === 0) {
    list.appendChild(createElement('li', 'empty-text',
      'Aucune action urgente : consolidez vos acquis et préparez la croissance.'));
    return;
  }
  answers.forEach((answer, index) => {
    const item = createElement('li', 'recommendation');
    const body = createElement('div');
    item.appendChild(createElement('span', 'recommendation-rank', String(index + 1)));
    body.appendChild(createElement('p', 'dimension-chip dim-' + answer.dimension, DIMENSIONS[answer.dimension].label));
    body.appendChild(createElement('h3', 'recommendation-title', answer.question.dataset.actionTitle));
    body.appendChild(createElement('p', 'recommendation-action', answer.question.dataset.actionText));
    body.appendChild(createElement('p', 'recommendation-reason', 'Pourquoi : ' + answer.question.dataset.weakness));
    item.appendChild(body);
    list.appendChild(item);
  });
}
