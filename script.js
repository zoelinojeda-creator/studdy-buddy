/*
  Lógica principal de StudyBuddy.
  Está comentada paso a paso para personas que recién empiezan.
*/

// Clave usada para guardar los puntos en localStorage.
const STORAGE_KEY = "studybuddy_points";

// Tomamos elementos del HTML para poder actualizarlos desde JavaScript.
const pointsElement = document.getElementById("points");
const mindyEmojiElement = document.getElementById("mindyEmoji");
const mindyStateElement = document.getElementById("mindyState");
const messageElement = document.getElementById("message");
const activityButtons = document.querySelectorAll(".activity-btn");
const resetButton = document.getElementById("resetBtn");

// Mensajes motivadores que se mostrarán al ganar puntos.
const motivatorMessages = [
  "¡Excelente! Cada sesión cuenta.",
  "¡Muy bien! Tu constancia te acerca a tus metas.",
  "¡Sigue así! Mindy está orgullosa de ti.",
  "¡Gran trabajo! Estás subiendo de nivel.",
  "¡Increíble! Tu esfuerzo diario se nota."
];

// Cargamos puntos guardados o empezamos en 0.
let points = Number(localStorage.getItem(STORAGE_KEY)) || 0;

/**
 * Guarda los puntos actuales en localStorage.
 */
function savePoints() {
  localStorage.setItem(STORAGE_KEY, String(points));
}

/**
 * Devuelve un mensaje motivador aleatorio.
 */
function getRandomMotivator() {
  const randomIndex = Math.floor(Math.random() * motivatorMessages.length);
  return motivatorMessages[randomIndex];
}

/**
 * Actualiza el estado visual de Mindy según los puntos.
 * - 0 a 49: dormida
 * - 50 a 99: feliz
 * - 100 o más: evolucionada
 */
function updateMindyState() {
  if (points >= 100) {
    mindyEmojiElement.textContent = "🦄";
    mindyEmojiElement.setAttribute("aria-label", "Mindy evolucionada");
    mindyStateElement.textContent = "¡Mindy evolucionó! Eres imparable.";
  } else if (points >= 50) {
    mindyEmojiElement.textContent = "😄";
    mindyEmojiElement.setAttribute("aria-label", "Mindy feliz");
    mindyStateElement.textContent = "Mindy está feliz. ¡Buen ritmo de estudio!";
  } else {
    mindyEmojiElement.textContent = "😴";
    mindyEmojiElement.setAttribute("aria-label", "Mindy dormida");
    mindyStateElement.textContent = "Mindy está dormida. ¡Hora de estudiar!";
  }
}

/**
 * Refresca en pantalla la cantidad de puntos y estado de Mindy.
 */
function render() {
  pointsElement.textContent = points;
  updateMindyState();
}

/**
 * Suma puntos al completar una actividad.
 * @param {number} earnedPoints - Puntos que se ganan por la actividad.
 */
function addPoints(earnedPoints) {
  points += earnedPoints;
  savePoints();
  render();

  messageElement.textContent = `Ganaste ${earnedPoints} puntos. ${getRandomMotivator()}`;
}

// Agregamos evento click a cada botón de actividad.
activityButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const earnedPoints = Number(button.dataset.points) || 0;
    addPoints(earnedPoints);
  });
});

// Botón para reiniciar progreso.
resetButton.addEventListener("click", () => {
  points = 0;
  savePoints();
  render();
  messageElement.textContent = "Progreso reiniciado. ¡Nuevo comienzo para ti y Mindy!";
});

// Primera renderización al abrir la app.
render();
