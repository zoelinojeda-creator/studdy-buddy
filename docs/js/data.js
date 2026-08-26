var APP = {
  user: null,
  session: { method: '', subject: '', topic: '', text: '', questionCount: 5 },
  activity: [],
  mindy: { hunger: 75, outfit: 'none', goal: 'normal', ownedOutfits: ['none'] },
  results: { correct: 0, wrong: 0, total: 0, pct: 0, xpEarned: 0 }
};

var AV_EMOJI = {
  huevo:'&#x1F423;', zorro:'&#x1F98A;', rana:'&#x1F438;',
  pulpo:'&#x1F419;', mariposa:'&#x1F98B;', invitado:'&#x1F47B;'
};
var FOOD_ITEMS = [
  {id:'apple',  ico:'&#x1F34E;', name:'Manzana',     price:10,  h:15},
  {id:'burger', ico:'&#x1F354;', name:'Hamburguesa', price:25,  h:30},
  {id:'pizza',  ico:'&#x1F355;', name:'Pizza',       price:40,  h:45},
  {id:'cake',   ico:'&#x1F382;', name:'Torta',       price:60,  h:60},
  {id:'sushi',  ico:'&#x1F363;', name:'Sushi',       price:80,  h:75},
  {id:'ramen',  ico:'&#x1F35C;', name:'Ramen',       price:100, h:100}
];
var OUTFIT_ITEMS = [
  {id:'none',    ico:'&#x1F6AB;', name:'Sin ropa',  price:0},
  {id:'hat',     ico:'&#x1F3A9;', name:'Sombrero',  price:30},
  {id:'crown',   ico:'&#x1F451;', name:'Corona',    price:80},
  {id:'glasses', ico:'&#x1F576;&#xFE0F;', name:'Anteojos', price:50},
  {id:'bow',     ico:'&#x1F380;', name:'Mono',      price:40},
  {id:'cape',    ico:'&#x1F9B8;', name:'Capa',      price:120}
];
// Duracion total (ms) para que, sin alimentar a Mindy, el hambre baje de 100 a ~0
var GOAL_MS = {
  casual:  24 * 60 * 60 * 1000,
  normal:  6  * 60 * 60 * 1000,
  intenso: 2  * 60 * 60 * 1000,
  extremo: 20 * 60 * 1000
};
var GOAL_HINT = {
  casual:  'Relajado — sin comer, Mindy estara muy hambrienta en 24 horas',
  normal:  'Equilibrado — sin comer, Mindy estara muy hambrienta en 6 horas',
  intenso: 'Desafiante — sin comer, Mindy estara muy hambrienta en 2 horas',
  extremo: 'Extremo — sin comer, Mindy estara muy hambrienta en 20 minutos'
};
var METHOD_LABEL = {
  flash:'&#x1F0CF; Flashcards',
  quiz:'&#x1F3AF; Quiz',
  complete:'&#x270F;&#xFE0F; Completar',
  rapid:'&#x26A1; Quiz Rapido'
};

var Q_MIN = 5;
var Q_MAX = 20;

function clampQuestionCount(n) {
  n = parseInt(n, 10);
  if (isNaN(n)) n = Q_MIN;
  if (n < Q_MIN) n = Q_MIN;
  if (n > Q_MAX) n = Q_MAX;
  return n;
}
