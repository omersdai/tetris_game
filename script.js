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

// Actions

const [
  MOVE_RIGHT,
  MOVE_LEFT,
  DROP,
  HARD_DROP,
  CLOCKWISE,
  COUNTER_CLOCKWISE,
  HOLD,
  PAUSE,
] = [
  'ArrowRight',
  'ArrowLeft',
  'ArrowDown',
  ' ',
  'ArrowUp',
  'Control',
  'Shift',
  'Escape',
];

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

const ghostMap = {
  [BLUE]: 'ghost-blue',
  [DARK_BLUE]: 'ghost-dark-blue',
  [ORANGE]: 'ghost-orange',
  [YELLOW]: 'ghost-yellow',
  [GREEN]: 'ghost-green',
  [PURPLE]: 'ghost-purple',
  [RED]: 'ghost-red',
};
const shapes = [BLUE, DARK_BLUE, ORANGE, YELLOW, GREEN, PURPLE, RED];

// Maps the indices of the shapes
const shapeMap = {
  [BLUE]: 0,
  [DARK_BLUE]: 1,
  [ORANGE]: 2,
  [YELLOW]: 3,
  [GREEN]: 4,
  [PURPLE]: 5,
  [RED]: 6,
};

// Maps the number of positions each shape has
const positionMap = {
  [BLUE]: 2,
  [DARK_BLUE]: 4,
  [ORANGE]: 4,
  [YELLOW]: 1,
  [GREEN]: 2,
  [PURPLE]: 4,
  [RED]: 2,
};

const shiftOrder = [1, -1, 2];

const holdShape = [];
const nextShapes = [[], [], []];
const tick = 300;

let hold;
let score;
let level;
let lines;
let nextArr;
let isPaused;
let tetris; // contains the colors of HTML boxes

let currShape;
let ghostShape;
let lockDelay;

let dropInterval;
let interval;

function startGame() {
  hold = null;
  score = 0;
  level = 1;
  lines = 0;
  // nextArr = [...generatePermutation(shapes), ...generatePermutation(shapes)];
  nextArr = [BLUE, DARK_BLUE, ORANGE, YELLOW, GREEN, PURPLE, RED].reverse();
  isPaused = false;
  tetris = [];
  for (let i = 0; i < rowCount + hiddrenRowCount; i++) {
    const arr = [];
    for (let j = 0; j < colCount; j++) {
      arr.push(null);
    }
    tetris.push(arr);
  }

  renderTetris(); // clear game grid

  spawnShape();

  dropInterval = null;
  // interval = setInterval(updateGame, tick);
}

function endGame() {
  clearInterval(interval);
  console.log('game over');
}

function updateGame() {
  if (goDown()) {
    // goDown();
  } else if (lockDelay-- === 0) {
    lockShape();
  }
}

function moveShape(colShift = 1) {
  if (!shapeFits(0, colShift)) return false;
  eraseShape(ghostShape);
  eraseShape(currShape);

  shiftShape(0, colShift);

  renderGhost();
  renderShape(currShape);
  return true;
}

function isGrounded(shape) {
  for (coor of shape.coordinates) {
    const row = coor[0] + 1;
    if (row === tetris.length || tetris[row][coor[1]]) return true;
  }
  return false;
}

function goDown() {
  if (isGrounded(currShape)) return false;
  eraseShape(currShape);
  currShape.coordinates.forEach((coordinate) => coordinate[0]++);
  renderShape(currShape);
  return true;
}

function lockShape() {
  eraseShape(currShape);
  currShape.coordinates = ghostShape.coordinates;
  for (coor of currShape.coordinates) {
    if (coor[0] < hiddrenRowCount) {
      endGame();
      return;
    }
    tetris[coor[0]][coor[1]] = currShape.color;
  }

  renderShape(currShape);
  spawnShape();
}

function spawnShape() {
  currShape = createShape(nextArr.pop());
  lockDelay = maxLockDelay;
  if (nextArr.length <= shapes.length)
    nextArr = [...generatePermutation(shapes), ...nextArr];

  // Update next shapes
  for (let i = 0; i < nextShapes.length; i++) {
    showShape(nextShapes[i], nextArr[nextArr.length - 1 - i]);
  }

  if (shapeFits(1, 0)) {
    shiftShape(1, 0);
    if (shapeFits(1, 0)) shiftShape(1, 0);
  }

  renderGhost();
  renderShape(currShape);
}

function keyDown(e) {
  console.log(e.key);
  switch (e.key) {
    case MOVE_RIGHT:
      moveShape(1);
      break;
    case MOVE_LEFT:
      moveShape(-1);
      break;
    case DROP:
      if (!dropInterval) {
        dropInterval = setInterval(goDown, tick / 3);
      }
      break;
    case HARD_DROP:
      lockShape();
      break;
    case CLOCKWISE:
      rotateShape();
      break;
    case COUNTER_CLOCKWISE:
      rotateShape(-1);
      break;
  }
}

function keyUp(e) {
  switch (e.key) {
    case DROP:
      clearInterval(dropInterval);
      dropInterval = null;
      break;
  }
}

function rotateShape(c = 1) {
  eraseShape(ghostShape);
  eraseShape(currShape);

  const coors = currShape.coordinates;
  const positionCount = positionMap[currShape.color];
  const transition =
    (currShape.position + positionCount + (c === 1 ? 0 : -1)) % positionCount;

  switch (currShape.color) {
    case BLUE:
      if (transition === 0) {
        currShape.coordinates = [
          [coors[0][0] - 3 * c, coors[0][1] + 2 * c],
          [coors[1][0] - 2 * c, coors[1][1] + 1 * c],
          [coors[2][0] - 1 * c, coors[2][1]],
          [coors[3][0], coors[3][1] - 1 * c],
        ];
      } else if (transition === 1) {
        currShape.coordinates = [
          [coors[0][0] + 3 * c, coors[0][1] - 2 * c],
          [coors[1][0] + 2 * c, coors[1][1] - 1 * c],
          [coors[2][0] + 1 * c, coors[2][1]],
          [coors[3][0], coors[3][1] + 1 * c],
        ];
      }

      break;
    case DARK_BLUE:
      if (transition === 0) {
        currShape.coordinates = [
          [coors[0][0] - 1 * c, coors[0][1] + 2 * c],
          [coors[1][0] - 2 * c, coors[1][1] + 1 * c],
          [coors[2][0] - 1 * c, coors[2][1]],
          [coors[3][0], coors[3][1] - 1 * c],
        ];
      } else if (transition === 1) {
        currShape.coordinates = [
          [coors[0][0] + 2 * c, coors[0][1]],
          [coors[1][0] + 1 * c, coors[1][1] + 1 * c],
          [coors[2][0], coors[2][1]],
          [coors[3][0] - 1 * c, coors[3][1] - 1 * c],
        ];
      } else if (transition === 2) {
        currShape.coordinates = [
          [coors[0][0], coors[0][1] - 1 * c],
          [coors[1][0] + 1 * c, coors[1][1]],
          [coors[2][0], coors[2][1] + 1 * c],
          [coors[3][0] - 1 * c, coors[3][1] + 2 * c],
        ];
      } else if (transition === 3) {
        currShape.coordinates = [
          [coors[0][0] - 1 * c, coors[0][1] - 1 * c],
          [coors[1][0], coors[1][1] - 2 * c],
          [coors[2][0] + 1 * c, coors[2][1] - 1 * c],
          [coors[3][0] + 2 * c, coors[3][1]],
        ];
      }
      break;
    case ORANGE:
      if (transition === 0) {
        currShape.coordinates = [
          [coors[0][0] - 2 * c, coors[0][1] + 1 * c],
          [coors[1][0] - 1 * c, coors[1][1]],
          [coors[2][0] + 1 * c, coors[2][1]],
          [coors[3][0], coors[3][1] - 1 * c],
        ];
      } else if (transition === 1) {
        currShape.coordinates = [
          [coors[0][0] + 1 * c, coors[0][1] + 1 * c],
          [coors[1][0], coors[1][1]],
          [coors[2][0], coors[2][1] - 2 * c],
          [coors[3][0] - 1 * c, coors[3][1] - 1 * c],
        ];
      } else if (transition === 2) {
        currShape.coordinates = [
          [coors[0][0] + 1 * c, coors[0][1]],
          [coors[1][0], coors[1][1] + 1 * c],
          [coors[2][0] - 2 * c, coors[2][1] + 1 * c],
          [coors[3][0] - 1 * c, coors[3][1] + 2 * c],
        ];
      } else if (transition === 3) {
        currShape.coordinates = [
          [coors[0][0], coors[0][1] - 2 * c],
          [coors[1][0] + 1 * c, coors[1][1] - 1 * c],
          [coors[2][0] + 1 * c, coors[2][1] + 1 * c],
          [coors[3][0] + 2 * c, coors[3][1]],
        ];
      }
      break;
    case YELLOW:
      break;
    case GREEN:
      if (transition === 0) {
        currShape.coordinates = [
          [coors[0][0] - 2 * c, coors[0][1] + 1 * c],
          [coors[1][0], coors[1][1] + 1 * c],
          [coors[2][0] - 1 * c, coors[2][1]],
          [coors[3][0] + 1 * c, coors[3][1]],
        ];
      } else if (transition === 1) {
        currShape.coordinates = [
          [coors[0][0] + 2 * c, coors[0][1] - 1 * c],
          [coors[1][0], coors[1][1] - 1 * c],
          [coors[2][0] + 1 * c, coors[2][1]],
          [coors[3][0] - 1 * c, coors[3][1]],
        ];
      }
      break;
    case PURPLE:
      if (transition === 0) {
        currShape.coordinates = [
          [coors[0][0] - 2 * c, coors[0][1] + 1 * c],
          [coors[1][0], coors[1][1] + 1 * c],
          [coors[2][0] - 1 * c, coors[2][1]],
          [coors[3][0], coors[3][1] - 1 * c],
        ];
      } else if (transition === 1) {
        currShape.coordinates = [
          [coors[0][0] + 1 * c, coors[0][1] + 1 * c],
          [coors[1][0] + 1 * c, coors[1][1] - 1 * c],
          [coors[2][0], coors[2][1]],
          [coors[3][0] - 1 * c, coors[3][1] - 1 * c],
        ];
      } else if (transition === 2) {
        currShape.coordinates = [
          [coors[0][0] + 1 * c, coors[0][1] - 1 * c],
          [coors[1][0] - 1 * c, coors[1][1] - 1 * c],
          [coors[2][0], coors[2][1]],
          [coors[3][0] - 1 * c, coors[3][1] + 1 * c],
        ];
      } else if (transition === 3) {
        currShape.coordinates = [
          [coors[0][0], coors[0][1] - 1 * c],
          [coors[1][0], coors[1][1] + 1 * c],
          [coors[2][0] + 1 * c, coors[2][1]],
          [coors[3][0] + 2 * c, coors[3][1] + 1 * c],
        ];
      }
      break;
    case RED:
      if (transition === 0) {
        currShape.coordinates = [
          [coors[0][0] - 1 * c, coors[0][1] + 2 * c],
          [coors[1][0], coors[1][1] + 1 * c],
          [coors[2][0] - 1 * c, coors[2][1]],
          [coors[3][0], coors[3][1] - 1 * c],
        ];
      } else if (transition === 1) {
        currShape.coordinates = [
          [coors[0][0] + 1 * c, coors[0][1] - 2 * c],
          [coors[1][0], coors[1][1] - 1 * c],
          [coors[2][0] + 1 * c, coors[2][1]],
          [coors[3][0], coors[3][1] + 1 * c],
        ];
      }
      break;
  }

  currShape.position = (currShape.position + positionCount + c) % positionCount;
  adjustShape();
  renderGhost();
  renderShape(currShape);
}

function adjustShape() {
  // Shift the shape right, left and up until it has space
  let i = 0;
  let rowShift = 0,
    colShift = 0;
  while (!shapeFits(rowShift, colShift)) {
    if (i < shiftOrder.length) {
      colShift = shiftOrder[i++];
    } else {
      i = 0;
      rowShift--;
      colShift = 0;
    }
  }
  shiftShape(rowShift, colShift);
  // To limit how many times the tetris block can go up
  if (rowShift < 0) lockDelay--;
}

function shiftShape(rowShift, colShift) {
  currShape.coordinates = currShape.coordinates.map((coor) => [
    coor[0] + rowShift,
    coor[1] + colShift,
  ]);
}

function shapeFits(rowShift, colShift) {
  // Checks left and right borders and occupied tetris squares
  for (coor of currShape.coordinates) {
    const row = coor[0] + rowShift,
      col = coor[1] + colShift;
    if (col < 0 || colCount <= col || tetris[row][col]) return false;
  }
  return true;
}

function createShape(color) {
  const start = hiddrenRowCount - 1; // the lowest row which is hidden
  const middle = parseInt(colCount / 2); // middle column of the grid
  const shape = { color, position: 0 };
  switch (color) {
    case BLUE:
      shape.coordinates = [
        [start, middle - 2],
        [start, middle - 1],
        [start, middle],
        [start, middle + 1],
      ];

      break;
    case DARK_BLUE:
      shape.coordinates = [
        [start - 1, middle - 2],
        [start, middle - 2],
        [start, middle - 1],
        [start, middle],
      ];
      break;
    case ORANGE:
      shape.coordinates = [
        [start, middle - 2],
        [start, middle - 1],
        [start - 1, middle],
        [start, middle],
      ];
      break;
    case YELLOW:
      shape.coordinates = [
        [start - 1, middle - 1],
        [start, middle - 1],
        [start - 1, middle],
        [start, middle],
      ];
      break;
    case GREEN:
      shape.coordinates = [
        [start, middle - 2],
        [start - 1, middle - 1],
        [start, middle - 1],
        [start - 1, middle],
      ];
      break;
    case PURPLE:
      shape.coordinates = [
        [start, middle - 2],
        [start - 1, middle - 1],
        [start, middle - 1],
        [start, middle],
      ];
      break;
    case RED:
      shape.coordinates = [
        [start - 1, middle - 2],
        [start - 1, middle - 1],
        [start, middle - 1],
        [start, middle],
      ];
      break;
  }
  return shape;
}

function showShape(shapeContainer, shape = null) {
  shapeContainer.forEach((shape) => shape.classList.add('hide'));
  if (shape) shapeContainer[shapeMap[shape]].classList.remove('hide');
}

function eraseShape(shape) {
  shape.coordinates.forEach(
    (coor) => (tetrisGrid[coor[0]][coor[1]].className = 'box bordered black')
  );
}

function renderShape(shape) {
  // Assumes shape does not overlap with colored squares
  shape.coordinates.forEach(
    (coor) =>
      (tetrisGrid[coor[0]][coor[1]].className = `box bordered ${shape.color}`)
  );
}

function renderGhost() {
  ghostShape = {
    color: ghostMap[currShape.color],
    // position: currShape.position,
    coordinates: copyCoordinates(currShape.coordinates),
  };

  while (!isGrounded(ghostShape)) {
    ghostShape.coordinates.forEach((coordinate) => coordinate[0]++);
  }

  renderShape(ghostShape);
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

function copyCoordinates(coordinates) {
  const newCoordinates = [];
  coordinates.forEach((coor) => newCoordinates.push([...coor]));
  return newCoordinates;
}

function generatePermutation(arr) {
  return arr
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

initializeGame();

title.addEventListener('click', (e) => startGame());

document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);
