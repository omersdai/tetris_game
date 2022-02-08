const holdContainer = document.getElementById('holdContainer');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const lineEl = document.getElementById('line');
const nextContainer = document.getElementById('nextContainer');
const tetrisEl = document.getElementById('tetris');

const title = document.getElementById('title');

const colCount = 10;
const hiddrenRowCount = 4;
const rowCount = 20;
const tetrisGrid = [];
const maxLockDelay = 3;

// Points
const singleClear = 100;
const doubleClear = 300;
const tripleClear = 500;
const tetrisClear = 800;
const comboMultiplier = 1.5;

const [BLUE, DARK_BLUE, ORANGE, YELLOW, GREEN, PURPLE, RED] = [
  'blue',
  'dark-blue',
  'orange',
  'yellow',
  'green',
  'purple',
  'red',
];
const shapes = [BLUE, DARK_BLUE, ORANGE, YELLOW, GREEN, PURPLE, RED];
const shapeMap = {
  [BLUE]: 0,
  [DARK_BLUE]: 1,
  [ORANGE]: 2,
  [YELLOW]: 3,
  [GREEN]: 4,
  [PURPLE]: 5,
  [RED]: 6,
};

const holdShape = [];
const nextShapes = [[], [], []];

let hold;
let score;
let level;
let lines;
let nextArr;
let currShape;
let lockDelay;

function startGame() {
  hold = null;
  score = 0;
  level = 1;
  lines = 0;
  nextArr = [...generatePermutation(shapes), ...generatePermutation(shapes)];
  spawnShape();
}

function spawnShape() {
  currShape = nextArr.pop();
  lockDelay = maxLockDelay;
  if (nextArr.length === 7)
    nextArr = [...generatePermutation(shapes), ...nextArr];

  // Update next shapes
  for (let i = 0; i < nextShapes.length; i++) {
    showShape(nextShapes[i], nextArr[nextArr.length - 1 - i]);
  }
}

function showShape(shapeContainer, shape = null) {
  shapeContainer.forEach((shape) => shape.classList.add('hide'));
  if (shape) shapeContainer[shapeMap[shape]].classList.remove('hide');
}

function initializeGame() {
  // Populate tetris section
  for (let i = 0; i < hiddrenRowCount; i++) {
    const arr = [];
    for (let j = 0; j < colCount; j++) {
      const box = document.createElement('div');
      arr.push(box);
    }
    tetrisGrid.push(arr);
  }
  for (let i = 0; i < rowCount; i++) {
    const row = document.createElement('div');
    const arr = [];
    row.className = 'row';
    for (let j = 0; j < colCount; j++) {
      const box = document.createElement('div');
      box.className = 'box bordered black';
      arr.push(box);
      row.appendChild(box);
    }
    tetrisGrid.push(arr);
    tetrisEl.appendChild(row);
  }

  holdContainer
    .querySelectorAll('.shape')
    .forEach((shape) => holdShape.push(shape));
  nextContainer
    .querySelectorAll('.shape-container')
    .forEach((container, idx) =>
      container
        .querySelectorAll('.shape')
        .forEach((shape) => nextShapes[idx].push(shape))
    );
}

function generatePermutation(arr) {
  return arr
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

initializeGame();

title.addEventListener('click', (e) => startGame());
