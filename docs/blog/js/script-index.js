/* Game Life */

const canvas = document.getElementById("gameOfLifeCanvas");
const ctx = canvas.getContext("2d");

let cellSize = 10;
const deadColor = "#FFFFFF";
const aliveColor = "#E6E6E6";
const updateInterval = 250;
let lastUpdateTime = 0;
let timer = 0;

let grid;
let numCols, numRows;

function createGrid(cols, rows) {
  let arr = new Array(cols);
  for (let i = 0; i < cols; i++) {
    arr[i] = new Array(rows);
    for (let j = 0; j < rows; j++) {
      arr[i][j] = Math.random() > 0.75 ? 1 : 0; // 1 = alive, 0 = dead
    }
  }
  return arr;
}

function countNeighbors(grid, x, y) {
  let count = 0;
  for (let i = -1; i < 2; i++) {
    for (let j = -1; j < 2; j++) {
      if (i === 0 && j === 0) continue; // Skip self

      const col = (x + i + numCols) % numCols;
      const row = (y + j + numRows) % numRows;

      count += grid[col][row];
    }
  }
  return count;
}

function calculateNextGeneration(currentGrid) {
  let nextGrid = new Array(numCols);
  for (let i = 0; i < numCols; i++) {
    nextGrid[i] = new Array(numRows);
    for (let j = 0; j < numRows; j++) {
      const state = currentGrid[i][j];
      const neighbors = countNeighbors(currentGrid, i, j);

      if (state === 1 && (neighbors < 2 || neighbors > 3)) {
        nextGrid[i][j] = 0;
      } else if (state === 0 && neighbors === 3) {
        nextGrid[i][j] = 1;
      } else {
        nextGrid[i][j] = state;
      }
    }
  }
  return nextGrid;
}

function drawGrid(grid) {
  ctx.fillStyle = deadColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = aliveColor;
  for (let i = 0; i < numCols; i++) {
    for (let j = 0; j < numRows; j++) {
      if (grid[i][j] === 1) {
        ctx.fillRect(
          i * cellSize + 1,
          j * cellSize + 1,
          cellSize - 2,
          cellSize - 2
        );
      }
    }
  }
}

function gameLoop(timestamp) {
  const deltaTime = timestamp - lastUpdateTime;

  if (timer > updateInterval) {
    const nextGrid = calculateNextGeneration(grid);
    drawGrid(nextGrid);
    grid = nextGrid;
    timer = 0;
    lastUpdateTime = timestamp;
  } else {
    timer += deltaTime;
    lastUpdateTime = timestamp;
  }

  requestAnimationFrame(gameLoop);
}

function setup() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  numCols = Math.ceil(canvas.width / cellSize);
  numRows = Math.ceil(canvas.height / cellSize);

  grid = createGrid(numCols, numRows);
  drawGrid(grid);

  lastUpdateTime = performance.now();
  timer = 0;
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

setup();
window.addEventListener("resize", debounce(setup, updateInterval));
requestAnimationFrame(gameLoop);
