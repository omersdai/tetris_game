const holdContainerEl = document.getElementById('holdContainer');
const bestScoreEl = document.getElementById('bestScore');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const lineEl = document.getElementById('line');
const nextContainerEl = document.getElementById('nextContainer');
const tetrisEl = document.getElementById('tetris');

const title = document.getElementById('title'); // this is temp, remove later

const holdContainer = [];
const nextContainers = [[], [], []];

const colCount = 10;
const hiddrenRowCount = 4;
const rowCount = 20;
const tetrisGrid = []; // contains tetris HTML boxes

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
const clearPoints = [0, 100, 300, 500, 800];
const comboMultiplier = 1.5;
const BEST_SCORE = 'tetrisBestScore';

const maxLockDelay = 5;
const maxTick = 1000;
const minTick = 100;

const levelChange = 20;
const levelReduction = 50;

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

let holdColor;
let score;
let bestScore;
let level;
let lines;
let nextArr;
let isPaused;
let isCombo;
let tick;
let tetris; // contains the colors of HTML boxes

let currShape;
let ghostShape;
let lockDelay;

let dropInterval;
let interval;

function startGame() {
  holdColor = null;
  score = 0;
  bestScore = parseInt(localStorage.getItem(BEST_SCORE));
  level = 0;
  lines = 0;
  nextArr = [...generatePermutation(shapes), ...generatePermutation(shapes)];
  // nextArr = [BLUE, DARK_BLUE, ORANGE, YELLOW, GREEN, PURPLE, RED].reverse();
  isPaused = false;
  isCombo = false;
  tick = maxTick;
  tetris = [];
  for (let i = 0; i < rowCount + hiddrenRowCount; i++) {
    const arr = [];
    for (let j = 0; j < colCount; j++) {
      arr.push(null);
    }
    tetris.push(arr);
  }

  renderTetris(); // clear game grid
  showShape(holdContainer);
  spawnShape();

  bestScoreEl.innerText = bestScore;
  scoreEl.innerText = score;
  levelEl.innerText = level + 1;
  lineEl.innerText = lines;

  dropInterval = null;
  interval = setInterval(updateGame, tick);
}

function endGame() {
  clearInterval(interval);
  console.log('game over');
}

function updateGame() {
  if (shapeFits(currShape, 1, 0)) {
    eraseShape(currShape);
    shiftShape(currShape, 1, 0);
    renderShape(currShape);
  } else if (lockDelay-- <= 0) {
    lockShape();
  }
}

function moveShape(colShift = 1) {
  if (!shapeFits(currShape, 0, colShift)) return false;
  eraseShape(ghostShape);
  eraseShape(currShape);

  shiftShape(currShape, 0, colShift);

  renderGhost();
  renderShape(currShape);
  return true;
}

function drop() {
  if (!shapeFits(currShape, 1, 0)) return;
  eraseShape(currShape);
  shiftShape(currShape, 1, 0);
  renderShape(currShape);
}

function lockShape() {
  eraseShape(currShape);
  currShape.coordinates = ghostShape.coordinates;
  for (const coor of currShape.coordinates) {
    if (coor[0] < hiddrenRowCount) {
      endGame();
      return;
    }
    tetris[coor[0]][coor[1]] = currShape.color;
  }

  clearLines();
  renderTetris();
  spawnShape();
}

function clearLines() {
  const rows = []; // unique row indices of the shape
  let completeLines = 0;
  for (const coor of currShape.coordinates) {
    if (!rows.includes(coor[0])) rows.push(coor[0]);
  }
  rows.sort((num1, num2) => num2 - num1);

  for (let j = 0; j < rows.length; j++) {
    const row = tetris[rows[j] + completeLines];
    let complete = true;
    for (let i = 0; i < colCount; i++) {
      if (!row[i]) {
        complete = false;
        break;
      }
    }
    if (complete) {
      completeLines++;
      // Clear line
      for (let i = 0; i < colCount; i++) {
        row[i] = null;
      }
      // Move all other lines down by one
      for (let i = rows[j] + completeLines - 1; 0 < i; i--) {
        tetris[i] = tetris[i - 1];
      }
      tetris[0] = row;
    }
  }
  lines += completeLines;
  score += clearPoints[completeLines] * (isCombo ? comboMultiplier : 1);
  if (bestScore < score) {
    bestScore = score;
    bestScoreEl.innerText = bestScore;
    localStorage.setItem(BEST_SCORE, bestScore);
  }
  level = parseInt(lines / levelChange);
  const newTick = Math.max(minTick, maxTick - level * levelReduction);
  if (tick !== newTick) {
    tick = newTick;
    clearInterval(interval);
    interval = setInterval(updateGame, tick);
  }
  isCombo = 0 < completeLines;

  scoreEl.innerText = score;
  levelEl.innerText = level + 1;
  lineEl.innerText = lines;
}

function spawnShape() {
  currShape = createShape(
    hiddrenRowCount - 1, // the lowest row which is hidden
    parseInt(colCount / 2), // middle column of the grid
    nextArr.pop()
  );
  lockDelay = maxLockDelay;
  if (nextArr.length <= shapes.length)
    nextArr = [...generatePermutation(shapes), ...nextArr];

  // Update next shapes
  for (let i = 0; i < nextContainers.length; i++) {
    showShape(nextContainers[i], nextArr[nextArr.length - 1 - i]);
  }

  if (shapeFits(currShape, 1, 0)) shiftShape(currShape, 1, 0);

  renderGhost();
  renderShape(currShape);
}

function keyDown(e) {
  e.preventDefault();
  switch (e.key) {
    case MOVE_RIGHT:
      moveShape(1);
      break;
    case MOVE_LEFT:
      moveShape(-1);
      break;
    case DROP:
      if (!dropInterval) {
        drop();
        dropInterval = setInterval(drop, tick / 3);
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
    case HOLD:
      hold();
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

function hold() {
  const oldColor = currShape.color;
  eraseShape(currShape);
  eraseShape(ghostShape);
  showShape(holdContainer, oldColor);

  if (!holdColor) {
    spawnShape();
  } else {
    currShape = createShape(currShape.bottom, currShape.center, holdColor);
    adjustShape();
    renderGhost();
    renderShape(currShape);
  }
  holdColor = oldColor;
}

function adjustShape() {
  // Shift the shape right, left and up until it has space
  let i = 0;
  let rowShift = 0,
    colShift = 0;
  while (!shapeFits(currShape, rowShift, colShift)) {
    if (i < shiftOrder.length) {
      colShift = shiftOrder[i++];
    } else {
      rowShift--;
      colShift = 0;
      i = 0;
    }
  }
  shiftShape(currShape, rowShift, colShift);
  // To limit how many times the tetris block can go up
  if (rowShift < 0) lockDelay--;
}

function shiftShape(shape, rowShift, colShift) {
  shape.bottom += rowShift;
  shape.center += colShift;
  shape.coordinates = shape.coordinates.map((coor) => [
    coor[0] + rowShift,
    coor[1] + colShift,
  ]);
}

function shapeFits(shape, rowShift, colShift) {
  // Checks left, right and bottom borders and occupied tetris squares
  for (const coor of shape.coordinates) {
    const row = coor[0] + rowShift,
      col = coor[1] + colShift;
    if (col < 0 || colCount <= col || tetris.length <= row || tetris[row][col])
      return false;
  }
  return true;
}

function createShape(start, middle, color) {
  const shape = { color, position: 0, bottom: start, center: middle };
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

function showShape(shapeContainer, color = null) {
  shapeContainer.forEach((shape) => shape.classList.add('hide'));
  if (color) shapeContainer[shapeMap[color]].classList.remove('hide');
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
    ...currShape,
    color: ghostMap[currShape.color],
    coordinates: copyCoordinates(currShape.coordinates),
  };

  while (shapeFits(ghostShape, 1, 0)) {
    shiftShape(ghostShape, 1, 0);
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

  holdContainerEl
    .querySelectorAll('.shape')
    .forEach((shape) => holdContainer.push(shape));
  nextContainerEl
    .querySelectorAll('.shape-container')
    .forEach((container, idx) =>
      container
        .querySelectorAll('.shape')
        .forEach((shape) => nextContainers[idx].push(shape))
    );

  if (!localStorage.getItem(BEST_SCORE)) localStorage.setItem(BEST_SCORE, '0');

  bestScoreEl.innerText = localStorage.getItem(BEST_SCORE);
  scoreEl.innerText = ' ';
  levelEl.innerText = ' ';
  lineEl.innerText = ' ';
}

function copyCoordinates(coordinates) {
  const newCoordinates = [];
  coordinates.forEach((coor) => newCoordinates.push([...coor]));
  return newCoordinates;
}

function generatePermutation(arr) {
  return arr
    .map((value) => [value, Math.random()])
    .sort((a, b) => a[1] - b[1])
    .map((value) => value[0]);
}

initializeGame();

title.addEventListener('click', (e) => {
  endGame();
  startGame();
});

document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);
