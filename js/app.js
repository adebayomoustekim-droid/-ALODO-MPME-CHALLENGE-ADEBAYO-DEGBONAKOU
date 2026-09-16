/* =========================================================================
   app.js — Navigation entre les écrans, progression, validation, sauvegarde

   Utilise les fonctions de score.js (chargé avant ce fichier).
   Parcours : Introduction → Questions (1 à 10) → Résultat
   ========================================================================= */

const STORAGE_KEY = 'alodo-mpme-diagnostic-v1';

// Éléments de la page utilisés dans ce fichier
const screens = {
  intro: document.getElementById('screen-intro'),
  questions: document.getElementById('screen-questions'),
  result: document.getElementById('screen-result'),
};
const form = document.getElementById('diagnostic-form');
const questions = document.querySelectorAll('.question');
const companyInput = document.getElementById('company-name');
const progressText = document.getElementById('progress-text');
const progressBar = document.getElementById('progress-bar');
const progressFill = document.getElementById('progress-fill');
const errorMessage = document.getElementById('error-message');
const btnPrevious = document.getElementById('btn-previous');
const btnNext = document.getElementById('btn-next');
const btnRestart = document.getElementById('btn-restart');

let currentIndex = 0;     // numéro de la question affichée (0 = première)
let isFinished = false;   // true quand le résultat a été affiché


/* ---------- 1. Affichage des écrans et des questions ---------- */

function showScreen(name) {
  for (const key in screens) {
    screens[key].hidden = key !== name;
  }
  window.scrollTo(0, 0);
}

function showQuestion(index) {
  currentIndex = index;

  // Une seule question visible
  questions.forEach((question, i) => {
    question.hidden = i !== index;
  });

  // Progression
  progressText.textContent = `Question ${index + 1} sur ${questions.length}`;
  progressFill.style.width = ((index + 1) / questions.length) * 100 + '%';
  progressBar.setAttribute('aria-valuenow', index + 1);

  // Boutons
  btnPrevious.textContent = index === 0 ? 'Accueil' : 'Précédent';
  btnNext.textContent = index === questions.length - 1 ? 'Voir mon résultat' : 'Suivant';
  errorMessage.textContent = '';

  showScreen('questions');
  // Le focus va sur la question : les lecteurs d'écran la lisent
  questions[index].querySelector('legend').focus({ preventScroll: true });
  saveProgress();
}

function showResult() {
  // Sécurité : s'il manque une réponse (ex. effacée en modifiant), on y retourne
  const missingIndex = findFirstUnanswered();
  if (missingIndex !== -1) {
    showQuestion(missingIndex);
    errorMessage.textContent = 'Cette question n’a pas encore de réponse.';
    return;
  }

  isFinished = true;
  displayResults(calculateResults(questions), companyInput.value.trim());
  showScreen('result');
  document.getElementById('result-title').focus({ preventScroll: true });
  saveProgress();
}

function findFirstUnanswered() {
  return Array.from(questions).findIndex((question) => getQuestionScore(question) === null);
}


/* ---------- 2. Validation ---------- */

function getErrorMessage(question) {
  const numberInput = question.querySelector('input[type="number"]');
  if (numberInput) {
    return numberInput.value === ''
      ? 'Indiquez un nombre pour continuer.'
      : 'Entrez un nombre entier entre 0 et 240.';
  }
  if (question.querySelector('input[type="checkbox"]')) {
    return 'Cochez au moins une réponse pour continuer.';
  }
  return 'Choisissez une réponse pour continuer.';
}

// « Aucun de ces documents » ne peut pas être coché avec une autre réponse
function handleExclusiveCheckbox(input) {
  if (input.type !== 'checkbox' || !input.checked) return;

  const checkboxes = input.closest('.question').querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach((other) => {
    const oneIsExclusive = input.hasAttribute('data-exclusive') || other.hasAttribute('data-exclusive');
    if (other !== input && oneIsExclusive) {
      other.checked = false;
    }
  });
}


/* ---------- 3. Sauvegarde dans le navigateur (localStorage) ---------- */

function saveProgress() {
  // On enregistre l'état de chaque champ, dans l'ordre de la page
  const values = Array.from(form.querySelectorAll('input')).map((input) =>
    input.type === 'number' ? input.value : input.checked
  );
  const data = { values, currentIndex, isFinished, companyName: companyInput.value };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    // Stockage indisponible (navigation privée, mémoire pleine) : on continue sans sauvegarde
  }
}

function loadProgress() {
  let data = null;
  try {
    data = JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch (error) {
    return; // sauvegarde illisible : on l'ignore
  }

  const inputs = form.querySelectorAll('input');
  // Si le questionnaire a changé depuis la sauvegarde, on l'ignore
  if (!data || !Array.isArray(data.values) || data.values.length !== inputs.length) return;

  inputs.forEach((input, i) => {
    if (input.type === 'number') input.value = data.values[i];
    else input.checked = data.values[i] === true;
  });
  currentIndex = Number(data.currentIndex) || 0;
  isFinished = data.isFinished === true;
  companyInput.value = data.companyName || '';
}

function updateResumePanel() {
  const answeredCount = Array.from(questions).filter((question) => getQuestionScore(question) !== null).length;

  document.getElementById('resume-panel').hidden = answeredCount === 0;
  document.getElementById('resume-text').textContent = isFinished
    ? 'Vous avez déjà terminé un diagnostic sur cet appareil.'
    : `Vous avez un diagnostic en cours (${answeredCount}/${questions.length} réponses).`;
  document.getElementById('btn-resume').textContent = isFinished
    ? 'Voir mon dernier résultat'
    : 'Reprendre où j’en étais';
}

function restart() {
  form.reset();
  companyInput.value = '';
  currentIndex = 0;
  isFinished = false;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    // rien à effacer
  }
  updateResumePanel();
  showScreen('intro');
}


/* ---------- 4. Réactions aux actions de l'utilisateur ---------- */

// Écran d'introduction
document.getElementById('start-form').addEventListener('submit', (event) => {
  event.preventDefault(); // empêche le rechargement de la page
  form.reset();
  isFinished = false;
  showQuestion(0);
});

document.getElementById('btn-resume').addEventListener('click', () => {
  if (isFinished) {
    showResult();
  } else {
    const index = findFirstUnanswered();
    showQuestion(index === -1 ? questions.length - 1 : index);
  }
});

document.getElementById('btn-reset-saved').addEventListener('click', restart);

// Écran des questions : bouton « Suivant » (et touche Entrée)
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const question = questions[currentIndex];

  if (getQuestionScore(question) === null) {
    errorMessage.textContent = getErrorMessage(question);
    errorMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }
  if (currentIndex < questions.length - 1) {
    showQuestion(currentIndex + 1);
  } else {
    showResult();
  }
});

btnPrevious.addEventListener('click', () => {
  if (currentIndex > 0) {
    showQuestion(currentIndex - 1);
  } else {
    updateResumePanel();
    showScreen('intro');
  }
});

// Chaque réponse cochée ou saisie est sauvegardée
form.addEventListener('change', (event) => {
  handleExclusiveCheckbox(event.target);
  errorMessage.textContent = '';
  saveProgress();
});
form.addEventListener('input', saveProgress);

// Boutons de choix rapide de la question 7
document.querySelectorAll('.chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    chip.closest('.question').querySelector('input[type="number"]').value = chip.dataset.value;
    errorMessage.textContent = '';
    saveProgress();
  });
});

// Écran de résultat
document.getElementById('btn-print').addEventListener('click', () => window.print());
document.getElementById('btn-edit').addEventListener('click', () => showQuestion(0));

// « Refaire le diagnostic » demande un 2e clic pour confirmer (évite d'effacer par erreur)
btnRestart.addEventListener('click', () => {
  if (btnRestart.classList.contains('is-armed')) {
    resetRestartButton();
    restart();
    return;
  }
  btnRestart.classList.add('is-armed');
  btnRestart.textContent = 'Confirmer : effacer mes réponses';
  setTimeout(resetRestartButton, 4000);
});

function resetRestartButton() {
  btnRestart.classList.remove('is-armed');
  btnRestart.textContent = 'Refaire le diagnostic';
}


/* ---------- 5. Démarrage ---------- */

loadProgress();
updateResumePanel();
showScreen('intro');
