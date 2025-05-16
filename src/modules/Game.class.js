'use strict';

if (typeof structuredClone === 'undefined') {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

class Game {
  static NUMBER_OF_ROWS = 4;
  static NUMBER_OF_COLUMNS = 4;

  constructor(initialState = Array.from({ length: 4 }, () => Array(4).fill(0))) {
    this.initialState = initialState;
    this.cells = structuredClone(this.initialState);
    this.changedСell = [];
    this.status = 'idle';
    this.score = 0;

    this.loadFromStorage();
  }

  updateScore(points) {
    this.score += points;
    this.saveToStorage();
  }

  getScore() {
    return this.score;
  }

  getState() {
    return structuredClone(this.cells);
  }

  getStatus() {
    return this.status;
  }

  win() {
    const e = new CustomEvent('win');
    document.dispatchEvent(e);
  }

  start() {
    this.status = 'playing';
    this.cells = structuredClone(this.initialState);
    this.addNewCell();
    this.addNewCell();
    this.saveToStorage();
  }

  restart() {
    this.score = 0;
    this.status = 'idle';
    this.cells = structuredClone(this.initialState);
    this.changedСell = [];
    this.saveToStorage();
  }

  moveLeft() {
    this.#move((row, col) => [row, col - 1]);
  }

  moveRight() {
    this.#move((row, col) => [row, col + 1], true);
  }

  moveUp() {
    this.#move((row, col) => [row - 1, col]);
  }

  moveDown() {
    this.#move((row, col) => [row + 1, col], true);
  }

  #move(getNextCell, reverse = false) {
    this.changedСell = [];
    let moved = false;
    const merged = new Set();
    let has2048 = false;
  
    const loop = (callback) => {
      for (let i = 0; i < 4; i++) {
        const line = reverse ? [3, 2, 1, 0] : [0, 1, 2, 3];
        for (const j of line) {
          callback(i, j);
        }
      }
    };
  
    loop((i, j) => {
      const [row, col] = this.status === 'playing' ? [i, j] : [];
      const cell = this.cells?.[row]?.[col];
      if (cell !== 0) {
        let [r, c] = [row, col];
        while (true) {
          const [nextR, nextC] = getNextCell(r, c);
          const next = this.cells?.[nextR]?.[nextC];
  
          if (nextR < 0 || nextC < 0 || nextR >= 4 || nextC >= 4) break;
  
          const key = `${nextR},${nextC}`;
          if (next === 0) {
            this.cells[nextR][nextC] = cell;
            this.cells[r][c] = 0;
            r = nextR;
            c = nextC;
            moved = true;
          } else if (next === cell && !merged.has(key)) {
            this.cells[nextR][nextC] = cell * 2;
            this.cells[r][c] = 0;
            this.changedСell.push([nextR, nextC]);
            this.updateScore(this.cells[nextR][nextC]);
            merged.add(key);
            moved = true;
  
            if (cell * 2 === 2048) {
              has2048 = true;
            }
  
            break;
          } else {
            break;
          }
        }
      }
    });
  
    if (moved) {
      this.addNewCell();
      this.saveToStorage();
  
      if (has2048 && this.status !== 'win') {
        this.status = 'win';
        this.win();
      } else if (!this.canMove()) {
        this.status = 'lose';
      }
    }
  }
  

  addNewCell() {
    if (!this.canMove()) {
      this.status = 'lose';
      return;
    }

    const emptyCells = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (this.cells[row][col] === 0) emptyCells.push([row, col]);
      }
    }

    if (emptyCells.length > 0) {
      const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      this.cells[row][col] = Math.random() < 0.1 ? 4 : 2;
      this.changedСell.push([row, col]);
    }
  }

  canMove() {
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const cell = this.cells[row][col];
        if (cell === 0) return true;
        if (col < 3 && this.cells[row][col + 1] === cell) return true;
        if (row < 3 && this.cells[row + 1][col] === cell) return true;
      }
    }
    return false;
  }

  saveToStorage() {
    const data = {
      score: this.score,
      status: this.status,
      cells: this.cells
    };
    localStorage.setItem('game2048', JSON.stringify(data));
  }

  loadFromStorage() {
    const data = localStorage.getItem('game2048');
    if (data) {
      const { score, status, cells } = JSON.parse(data);
      this.score = score;
      this.status = status;
      this.cells = cells;
    }
  }
}

module.exports = Game;

// Code to force win:
//document.dispatchEvent(new CustomEvent('win'));
