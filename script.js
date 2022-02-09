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

const positionMap = {
  [BLUE]: 2,
  [DARK_BLUE]: 4,
  [ORANGE]: 4,
  [YELLOW]: 1,
  [GREEN]: 2,
  [PURPLE]: 4,
  [RED]: 2,
};

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
let dropInterval;
let interval;

let currShape;
let lockDelay;

function startGame() {
  hold = null;
  score = 0;
  level = 1;
  lines = 0;
  nextArr = [...generatePermutation(shapes), ...generatePermutation(shapes)];
  // nextArr = [BLUE, DARK_BLUE, ORANGE, YELLOW, GREEN, PURPLE, DARK_BLUE];
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

function moveShape(count = 1) {
  const newCoordinates = copyCoordinates(currShape.coordinates);
  for (coor of newCoordinates) {
    coor[1] += count;
    if (coor[1] < 0 || colCount <= coor[1] || tetris[coor[0]][coor[1]])
      return false;
  }
  eraseShape();
  currShape.coordinates = newCoordinates;
  renderShape();
  return true;
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
  if (isGrounded()) return false;
  eraseShape();
  currShape.coordinates.forEach((coordinate) => coordinate[0]++);
  renderShape();
  return true;
}

function hardDrop() {
  while (goDown());
  lockShape();
}

function lockShape() {
  for (coor of currShape.coordinates) {
    if (coor[0] < hiddrenRowCount) {
      endGame();
      return;
    }
    tetris[coor[0]][coor[1]] = currShape.color;
  }
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
      hardDrop();
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
  eraseShape();

  const coors = currShape.coordinates;

  switch (currShape.color) {
    case BLUE:
      if (currShape.position === 0) {
        currShape.coordinates = [
          [coors[0][0] - 3 * c, coors[0][1] + 2 * c],
          [coors[1][0] - 2 * c, coors[1][1] + 1 * c],
          [coors[2][0] - 1 * c, coors[2][1]],
          [coors[3][0], coors[3][1] - 1 * c],
        ];
      } else if (currShape.position === 1) {
        currShape.coordinates = [
          [coors[0][0] + 3 * c, coors[0][1] - 2 * c],
          [coors[1][0] + 2 * c, coors[1][1] - 1 * c],
          [coors[2][0] + 1 * c, coors[2][1]],
          [coors[3][0], coors[3][1] + 1 * c],
        ];
      }

      break;
    case DARK_BLUE:
      if (currShape.position === 0) {
        currShape.coordinates = [
          [coors[0][0] - 1 * c, coors[0][1] + 2 * c],
          [coors[1][0] - 2 * c, coors[1][1] + 1 * c],
          [coors[2][0] - 1 * c, coors[2][1]],
          [coors[3][0], coors[3][1] - 1 * c],
        ];
      } else if (currShape.position === 1) {
        currShape.coordinates = [
          [coors[0][0] + 2 * c, coors[0][1]],
          [coors[1][0] + 1 * c, coors[1][1] + 1 * c],
          [coors[2][0], coors[2][1]],
          [coors[3][0] - 1 * c, coors[3][1] - 1 * c],
        ];
      } else if (currShape.position === 2) {
        currShape.coordinates = [
          [coors[0][0], coors[0][1] - 1 * c],
          [coors[1][0] + 1 * c, coors[1][1]],
          [coors[2][0], coors[2][1] + 1 * c],
          [coors[3][0] - 1 * c, coors[3][1] + 2 * c],
        ];
      } else if (currShape.position === 3) {
        currShape.coordinates = [
          [coors[0][0] - 1 * c, coors[0][1] - 1 * c],
          [coors[1][0], coors[1][1] - 2 * c],
          [coors[2][0] + 1 * c, coors[2][1] - 1 * c],
          [coors[3][0] + 2 * c, coors[3][1]],
        ];
      }
      break;
    case ORANGE:
      if (currShape.position === 0) {
        currShape.coordinates = [
          [coors[0][0] - 2 * c, coors[0][1] + 1 * c],
          [coors[1][0] - 1 * c, coors[1][1]],
          [coors[2][0] + 1 * c, coors[2][1]],
          [coors[3][0], coors[3][1] - 1 * c],
        ];
      } else if (currShape.position === 1) {
        currShape.coordinates = [
          [coors[0][0] + 1 * c, coors[0][1] + 1 * c],
          [coors[1][0], coors[1][1]],
          [coors[2][0], coors[2][1] - 2 * c],
          [coors[3][0] - 1 * c, coors[3][1] - 1 * c],
        ];
      } else if (currShape.position === 2) {
        currShape.coordinates = [
          [coors[0][0] + 1 * c, coors[0][1]],
          [coors[1][0], coors[1][1] + 1 * c],
          [coors[2][0] - 2 * c, coors[2][1] + 1 * c],
          [coors[3][0] - 1 * c, coors[3][1] + 2 * c],
        ];
      } else if (currShape.position === 3) {
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
      if (currShape.position === 0) {
        currShape.coordinates = [
          [coors[0][0] - 2 * c, coors[0][1] + 1 * c],
          [coors[1][0], coors[1][1] + 1 * c],
          [coors[2][0] - 1 * c, coors[2][1]],
          [coors[3][0] + 1 * c, coors[3][1]],
        ];
      } else if (currShape.position === 1) {
        currShape.coordinates = [
          [coors[0][0] + 2 * c, coors[0][1] - 1 * c],
          [coors[1][0], coors[1][1] - 1 * c],
          [coors[2][0] + 1 * c, coors[2][1]],
          [coors[3][0] - 1 * c, coors[3][1]],
        ];
      }
      break;
    case PURPLE:
      if (currShape.position === 0) {
        currShape.coordinates = [
          [coors[0][0] - 2 * c, coors[0][1] + 1 * c],
          [coors[1][0], coors[1][1] + 1 * c],
          [coors[2][0] - 1 * c, coors[2][1]],
          [coors[3][0], coors[3][1] - 1 * c],
        ];
      } else if (currShape.position === 1) {
        currShape.coordinates = [
          [coors[0][0] + 1 * c, coors[0][1] + 1 * c],
          [coors[1][0] + 1 * c, coors[1][1] - 1 * c],
          [coors[2][0], coors[2][1]],
          [coors[3][0] - 1 * c, coors[3][1] - 1 * c],
        ];
      } else if (currShape.position === 2) {
        currShape.coordinates = [
          [coors[0][0] + 1 * c, coors[0][1] - 1 * c],
          [coors[1][0] - 1 * c, coors[1][1] - 1 * c],
          [coors[2][0], coors[2][1]],
          [coors[3][0] - 1 * c, coors[3][1] + 1 * c],
        ];
      } else if (currShape.position === 3) {
        currShape.coordinates = [
          [coors[0][0], coors[0][1] - 1 * c],
          [coors[1][0], coors[1][1] + 1 * c],
          [coors[2][0] + 1 * c, coors[2][1]],
          [coors[3][0] + 2 * c, coors[3][1] + 1 * c],
        ];
      }
      break;
    case RED:
      if (currShape.position === 0) {
        currShape.coordinates = [
          [coors[0][0] - 1 * c, coors[0][1] + 2 * c],
          [coors[1][0], coors[1][1] + 1 * c],
          [coors[2][0] - 1 * c, coors[2][1]],
          [coors[3][0], coors[3][1] - 1 * c],
        ];
      } else if (currShape.position === 1) {
        currShape.coordinates = [
          [coors[0][0] + 1 * c, coors[0][1] - 2 * c],
          [coors[1][0], coors[1][1] - 1 * c],
          [coors[2][0] + 1 * c, coors[2][1]],
          [coors[3][0], coors[3][1] + 1 * c],
        ];
      }
      break;
  }
  const positionCount = positionMap[currShape.color];
  currShape.position = (currShape.position + positionCount + 1) % positionCount;
  renderShape();
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
