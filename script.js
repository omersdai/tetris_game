const holdContainer = document.getElementById('holdContainer');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const lineEl = document.getElementById('line');
const nextContainer = document.getElementById('nextContainer');
const tetrisEl = document.getElementById('tetris');

const title = document.getElementById('title'); // this is temp, remove later

const colCount = 10;
const hiddrenRowCount = 4;
const rowCount = 20;
const tetrisGrid = []; // contains tetris HTML boxes
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
const tick = 200;

let hold;
let score;
let level;
let lines;
let nextArr;
let isPaused;
let tetris; // contains the colors of HTML boxes
let interval;

let currShape;
let lockDelay;

function startGame() {
  hold = null;
  score = 0;
  level = 1;
  lines = 0;
  nextArr = [...generatePermutation(shapes), ...generatePermutation(shapes)];
  //   nextArr = ['red', 'red', 'red'];
  isPaused = false;
  tetris = [];
  for (let i = 0; i < rowCount + hiddrenRowCount; i++) {
    const arr = [];
    for (let j = 0; j < colCount; j++) {
      arr.push(null);
    }
    tetris.push(arr);
  }

  spawnShape();

  interval = setInterval(updateGame, tick);
}

function endGame() {
  clearInterval(interval);
  console.log('game over');
}

function updateGame() {
  if (!isGrounded()) {
    goDown();
  } else if (lockDelay-- === 0) {
    lockShape();
    spawnShape();
  }
}

function isGrounded() {
  for (coordinate of currShape.coordinates) {
    if (
      coordinate[0] === tetris.length - 1 ||
      tetris[coordinate[0] + 1][coordinate[1]]
    )
      return true;
  }
  return false;
}

function goDown(count = 1) {
  eraseShape();
  currShape.coordinates.forEach((coordinate) => coordinate[0]++);
  renderShape();
}

function lockShape() {
  for (coor of currShape.coordinates) {
    if (coor[0] < hiddrenRowCount) {
      endGame();
      return;
    }
    tetris[coor[0]][coor[1]] = currShape.color;
  }
}

function spawnShape() {
  currShape = createShape(nextArr.pop());
  lockDelay = maxLockDelay;
  if (nextArr.length === shapes.length)
    nextArr = [...generatePermutation(shapes), ...nextArr];

  // Update next shapes
  for (let i = 0; i < nextShapes.length; i++) {
    showShape(nextShapes[i], nextArr[nextArr.length - 1 - i]);
  }
}

function createShape(shape) {
  const start = hiddrenRowCount - 1; // the lowest row which is hidden
  const middle = parseInt(colCount / 2); // middle column of the grid
  switch (shape) {
    case BLUE:
      return {
        color: shape,
        coordinates: [
          [start, middle - 2],
          [start, middle - 1],
          [start, middle],
          [start, middle + 1],
        ],
      };
      break;
    case DARK_BLUE:
      return {
        color: shape,
        coordinates: [
          [start - 1, middle - 2],
          [start, middle - 2],
          [start, middle - 1],
          [start, middle],
        ],
      };
      break;
    case ORANGE:
      return {
        color: shape,
        coordinates: [
          [start, middle - 2],
          [start, middle - 1],
          [start - 1, middle],
          [start, middle],
        ],
      };
      break;
    case YELLOW:
      return {
        color: shape,
        coordinates: [
          [start - 1, middle - 1],
          [start, middle - 1],
          [start - 1, middle],
          [start, middle],
        ],
      };
      break;
    case GREEN:
      return {
        color: shape,
        coordinates: [
          [start, middle - 2],
          [start - 1, middle - 1],
          [start, middle - 1],
          [start - 1, middle],
        ],
      };
      break;
    case PURPLE:
      return {
        color: shape,
        coordinates: [
          [start, middle - 2],
          [start - 1, middle - 1],
          [start, middle - 1],
          [start, middle],
        ],
      };
      break;
    case RED:
      return {
        color: shape,
        coordinates: [
          [start - 1, middle - 2],
          [start - 1, middle - 1],
          [start, middle - 1],
          [start, middle],
        ],
      };
      break;
  }
}

function showShape(shapeContainer, shape = null) {
  shapeContainer.forEach((shape) => shape.classList.add('hide'));
  if (shape) shapeContainer[shapeMap[shape]].classList.remove('hide');
}

function eraseShape() {
  currShape.coordinates.forEach(
    (coor) => (tetrisGrid[coor[0]][coor[1]].className = 'box bordered black')
  );
}

function renderShape() {
  // Assumes currShape does not overlap with colored squares
  currShape.coordinates.forEach(
    (coor) =>
      (tetrisGrid[coor[0]][
        coor[1]
      ].className = `box bordered ${currShape.color}`)
  );
}

function renderTetris() {
  for (let i = 0; i < rowCount; i++) {
    for (let j = 0; j < colCount; j++) {
      const box = tetrisGrid[i + hiddrenRowCount][j];
      const color = tetris[i + hiddrenRowCount][j];
      box.className = `box bordered ${color ? color : 'black'}`;
    }
  }
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
