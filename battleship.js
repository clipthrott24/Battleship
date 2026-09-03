const Battleship = (() => {
  const BOARD_SIZE = 10;
  const SHIP_TYPES = [
    { id: 'carrier', name: 'Carrier', length: 5 },
    { id: 'battleship', name: 'Battleship', length: 4 },
    { id: 'cruiser', name: 'Cruiser', length: 3 },
    { id: 'submarine', name: 'Submarine', length: 3 },
    { id: 'destroyer', name: 'Destroyer', length: 2 },
  ];
  const ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  const DIRECTIONS = [{ r: -1, c: 0 }, { r: 1, c: 0 }, { r: 0, c: -1 }, { r: 0, c: 1 }];

  function createEmptyBoard() {
    return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
  }

  function createFleet() {
    return SHIP_TYPES.map(t => ({
      ...t,
      placed: false,
      sunk: false,
      hits: 0,
      row: null,
      col: null,
      horizontal: true,
    }));
  }

  function inBounds(r, c) {
    return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
  }

  function shipCells(row, col, length, horizontal) {
    const cells = [];
    for (let i = 0; i < length; i++) {
      const r = horizontal ? row : row + i;
      const c = horizontal ? col + i : col;
      cells.push({ r, c });
    }
    return cells;
  }

  function canPlace(board, row, col, length, horizontal, ignoreShipId = null) {
    const cells = shipCells(row, col, length, horizontal);
    for (const { r, c } of cells) {
      if (!inBounds(r, c)) return false;
      const occupant = board[r][c];
      if (occupant !== null && occupant !== ignoreShipId) return false;
    }
    return true;
  }

  function clearShip(board, ship) {
    if (!ship.placed) return;
    for (const { r, c } of shipCells(ship.row, ship.col, ship.length, ship.horizontal)) {
      if (inBounds(r, c) && board[r][c] === ship.id) board[r][c] = null;
    }
    ship.placed = false;
    ship.row = null;
    ship.col = null;
    ship.horizontal = true;
  }

  function placeShip(board, ship, row, col, horizontal) {
    clearShip(board, ship);
    ship.row = row;
    ship.col = col;
    ship.horizontal = horizontal;
    ship.placed = true;
    for (const { r, c } of shipCells(row, col, ship.length, horizontal)) {
      board[r][c] = ship.id;
    }
  }

  function clearAllShips(board, fleet) {
    for (const ship of fleet) clearShip(board, ship);
  }

  function randomize(board, fleet) {
    for (let attempt = 0; attempt < 200; attempt++) {
      clearAllShips(board, fleet);
      let ok = true;
      for (const ship of fleet) {
        let placed = false;
        for (let inner = 0; inner < 1000; inner++) {
          const row = Math.floor(Math.random() * BOARD_SIZE);
          const col = Math.floor(Math.random() * BOARD_SIZE);
          const horizontal = Math.random() < 0.5;
          if (canPlace(board, row, col, ship.length, horizontal)) {
            placeShip(board, ship, row, col, horizontal);
            placed = true;
            break;
          }
        }
        if (!placed) { ok = false; break; }
      }
      if (ok) return true;
    }
    return false;
  }

  function allShipsPlaced(fleet) {
    return fleet.every(s => s.placed);
  }

  function initGame(difficulty = 'Medium') {
    return {
      phase: 'placement',
      difficulty,
      winner: null,
      humanBoard: createEmptyBoard(),
      humanFleet: createFleet(),
      aiBoard: createEmptyBoard(),
      aiFleet: createFleet(),
      playerShots: createEmptyBoard(),
      aiShots: createEmptyBoard(),
    };
  }

  function resetGame(game) {
    const difficulty = game.difficulty;
    game.phase = 'placement';
    game.difficulty = difficulty;
    game.winner = null;
    game.humanBoard = createEmptyBoard();
    game.humanFleet = createFleet();
    game.aiBoard = createEmptyBoard();
    game.aiFleet = createFleet();
    game.playerShots = createEmptyBoard();
    game.aiShots = createEmptyBoard();
  }

  function setDifficulty(game, difficulty) {
    game.difficulty = difficulty;
  }

  function resolveShot(fleet, shipBoard, shots, row, col) {
    if (!inBounds(row, col) || shots[row][col] !== null) {
      return { result: 'already' };
    }
    const shipId = shipBoard[row][col];
    if (shipId === null) {
      shots[row][col] = 'miss';
      return { result: 'miss' };
    }
    const ship = fleet.find(s => s.id === shipId);
    ship.hits += 1;
    if (ship.hits >= ship.length) {
      ship.sunk = true;
      for (const { r, c } of shipCells(ship.row, ship.col, ship.length, ship.horizontal)) {
        shots[r][c] = 'sunk';
      }
      return { result: 'sunk', ship, gameOver: fleet.every(s => s.sunk) };
    }
    shots[row][col] = 'hit';
    return { result: 'hit', ship };
  }

  function playerTurn(game, row, col) {
    const res = resolveShot(game.aiFleet, game.aiBoard, game.playerShots, row, col);
    if (res.gameOver) game.winner = 'human';
    return res;
  }

  function randomCell(shots) {
    const cells = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (shots[r][c] === null) cells.push({ r, c });
      }
    }
    if (cells.length === 0) return null;
    return cells[Math.floor(Math.random() * cells.length)];
  }

  function getUnresolvedHits(shots) {
    const hits = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (shots[r][c] === 'hit') hits.push({ r, c });
      }
    }
    return hits;
  }

  function isValidTarget(shots, r, c) {
    return inBounds(r, c) && shots[r][c] === null;
  }

  function cellKey(c) { return `${c.r},${c.c}`; }

  function consecutiveRuns(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const runs = [];
    let start = sorted[0];
    let prev = sorted[0];
    for (let i = 1; i <= sorted.length; i++) {
      const v = sorted[i];
      if (v === prev + 1) { prev = v; continue; }
      if (prev > start) runs.push([start, prev]);
      start = v;
      prev = v;
    }
    return runs;
  }

  function huntTarget(shots, unresolved) {
    const line = new Map();
    const byRow = new Map();
    const byCol = new Map();
    for (const { r, c } of unresolved) {
      if (!byRow.has(r)) byRow.set(r, []);
      byRow.get(r).push(c);
      if (!byCol.has(c)) byCol.set(c, []);
      byCol.get(c).push(r);
    }
    for (const [r, cols] of byRow) {
      for (const [min, max] of consecutiveRuns(cols)) {
        const left = { r, c: min - 1 };
        const right = { r, c: max + 1 };
        if (isValidTarget(shots, left.r, left.c)) line.set(cellKey(left), left);
        if (isValidTarget(shots, right.r, right.c)) line.set(cellKey(right), right);
      }
    }
    for (const [c, rows] of byCol) {
      for (const [min, max] of consecutiveRuns(rows)) {
        const top = { r: min - 1, c };
        const bottom = { r: max + 1, c };
        if (isValidTarget(shots, top.r, top.c)) line.set(cellKey(top), top);
        if (isValidTarget(shots, bottom.r, bottom.c)) line.set(cellKey(bottom), bottom);
      }
    }
    if (line.size > 0) {
      const arr = Array.from(line.values());
      return arr[Math.floor(Math.random() * arr.length)];
    }
    const adj = new Map();
    for (const { r, c } of unresolved) {
      for (const d of DIRECTIONS) {
        const t = { r: r + d.r, c: c + d.c };
        if (isValidTarget(shots, t.r, t.c)) adj.set(cellKey(t), t);
      }
    }
    if (adj.size > 0) {
      const arr = Array.from(adj.values());
      return arr[Math.floor(Math.random() * arr.length)];
    }
    return randomCell(shots);
  }

  function aiCanPlace(shots, row, col, length, horizontal) {
    for (const { r, c } of shipCells(row, col, length, horizontal)) {
      if (!inBounds(r, c)) return false;
      const s = shots[r][c];
      if (s === 'miss' || s === 'sunk') return false;
    }
    return true;
  }

  function densityTarget(shots, fleet) {
    const lengths = fleet.filter(s => !s.sunk).map(s => s.length);
    const density = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
    for (const len of lengths) {
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          for (const h of [true, false]) {
            if (aiCanPlace(shots, r, c, len, h)) {
              for (const { r: rr, c: cc } of shipCells(r, c, len, h)) {
                density[rr][cc] += 1;
              }
            }
          }
        }
      }
    }
    let best = -1;
    const candidates = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (shots[r][c] !== null) continue;
        const d = density[r][c];
        if (d > best) { best = d; candidates.length = 0; }
        if (d === best && d > 0) candidates.push({ r, c, d });
      }
    }
    if (candidates.length === 0) return randomCell(shots);
    const threshold = best * 0.95;
    const top = candidates.filter(c => c.d >= threshold);
    const parity = top.filter(c => (c.r + c.c) % 2 === 0);
    const pool = parity.length > 0 ? parity : top;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function aiChooseCell(game) {
    if (game.difficulty === 'Easy') return randomCell(game.aiShots);
    const unresolved = getUnresolvedHits(game.aiShots);
    if (unresolved.length > 0) return huntTarget(game.aiShots, unresolved);
    if (game.difficulty === 'Medium') return randomCell(game.aiShots);
    return densityTarget(game.aiShots, game.humanFleet);
  }

  function aiTurn(game) {
    const target = aiChooseCell(game);
    if (!target) return null;
    const res = resolveShot(game.humanFleet, game.humanBoard, game.aiShots, target.r, target.c);
    if (res.gameOver) game.winner = 'ai';
    return { ...res, ...target };
  }

  return {
    BOARD_SIZE,
    SHIP_TYPES,
    ROW_LABELS,
    createGame: () => initGame('Medium'),
    initGame,
    resetGame,
    setDifficulty,
    shipCells,
    canPlace,
    placeShip,
    clearShip,
    clearAllShips,
    randomize,
    allShipsPlaced,
    resolveShot,
    playerTurn,
    aiTurn,
    aiChooseCell,
  };
})();
