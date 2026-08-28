(() => {
  const $ = id => document.getElementById(id);
  const STORAGE_SOUND = 'bs-sound';
  const STORAGE_DIFFICULTY = 'bs-difficulty';
  let game = Battleship.createGame();
  let selectedShipId = null;
  let horizontal = true;
  let previewCells = [];
  let inputLocked = false;
  let audioCtx = null;
  const missAudio = new Audio('miss.mp3');
  const hitAudio = new Audio('hit.mp3');
  const musicAudio = new Audio('music.mp3');
  musicAudio.loop = true;
  musicAudio.volume = 0.5;

  const placementSection = $('placement');
  const battleSection = $('battle');
  const endScreen = $('end-screen');
  const statusEl = $('status');
  const placementBoard = $('human-board');
  const rosterEl = $('ship-roster');
  const humanFleetBoard = $('human-fleet');
  const enemyWatersBoard = $('enemy-waters');
  const logEl = $('game-log');
  const humanList = $('human-fleet-list');
  const enemyList = $('enemy-fleet-list');
  const rotateBtn = $('rotate-btn');
  const randomBtn = $('random-btn');
  const clearBtn = $('clear-btn');
  const confirmBtn = $('confirm-btn');
  const difficultySelect = $('difficulty');
  const soundToggle = $('sound-toggle');
  const newGameBtn = $('new-game');
  const playAgainBtn = $('play-again');
  const endTitle = $('end-title');
  const endMessage = $('end-message');

  function rowLabel(index) { return Battleship.ROW_LABELS[index]; }
  function colLabel(index) { return String(index + 1); }

  function loadSetting(key, def) {
    try { return localStorage.getItem(key) || def; } catch { return def; }
  }

  function saveSetting(key, val) {
    try { localStorage.setItem(key, val); } catch {}
  }

  function createBoard(el) {
    el.innerHTML = '';
    el.style.gridTemplateColumns = `repeat(${Battleship.BOARD_SIZE + 1}, 1fr)`;
    el.appendChild(document.createElement('div'));
    for (let c = 0; c < Battleship.BOARD_SIZE; c++) {
      const th = document.createElement('div');
      th.className = 'label';
      th.textContent = colLabel(c);
      el.appendChild(th);
    }
    for (let r = 0; r < Battleship.BOARD_SIZE; r++) {
      const th = document.createElement('div');
      th.className = 'label';
      th.textContent = rowLabel(r);
      el.appendChild(th);
      for (let c = 0; c < Battleship.BOARD_SIZE; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.r = r;
        cell.dataset.c = c;
        el.appendChild(cell);
      }
    }
    const overlay = document.createElement('img');
    overlay.className = 'win-gif hidden';
    overlay.src = 'gravewalker-nuncamorto.gif';
    overlay.alt = '';
    el.appendChild(overlay);
    const defeated = document.createElement('div');
    defeated.className = 'defeated hidden';
    defeated.textContent = 'DEFEATED';
    el.appendChild(defeated);
    const fireworks = document.createElement('div');
    fireworks.className = 'fireworks hidden';
    el.appendChild(fireworks);
    const victorious = document.createElement('div');
    victorious.className = 'victorious hidden';
    victorious.textContent = 'VICTORIOUS';
    el.appendChild(victorious);
  }

  function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }

  function playTone(freq, dur, type, when, slideTo) {
    type = type || 'sine';
    when = when || 0;
    const t = audioCtx.currentTime + 0.05 + when;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    if (slideTo !== undefined) {
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    } else {
      osc.frequency.setValueAtTime(freq, t);
    }
    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + dur);
  }

  function playSound(type) {
    if (!soundToggle.checked) return;
    initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (type === 'miss') {
      missAudio.currentTime = 0;
      missAudio.play().catch(() => {});
    }
    else if (type === 'hit') {
      hitAudio.currentTime = 0;
      hitAudio.play().catch(() => {});
    }
    else if (type === 'sunk') playTone(350, 0.35, 'sine', 0, 80);
    else if (type === 'win') { playTone(523, 0.13); playTone(659, 0.13, 'sine', 0.13); playTone(784, 0.2, 'sine', 0.26); }
    else if (type === 'lose') { playTone(392, 0.18); playTone(330, 0.18, 'sine', 0.18); playTone(262, 0.25, 'sine', 0.36); }
  }

  function renderBoard(el, shipBoard, shots, showShips, revealShips, fleet) {
    for (const cell of el.querySelectorAll('.cell')) {
      const r = Number(cell.dataset.r);
      const c = Number(cell.dataset.c);
      const shipId = shipBoard[r][c];
      const shot = shots[r][c];
      const classes = ['cell'];
      cell.style.removeProperty('background-position');
      cell.style.removeProperty('transform');
      if (shot === 'miss') classes.push('miss');
      if (shot === 'hit') classes.push('hit');
      if (shot === 'sunk') classes.push('sunk', 'ship', `ship-${shipId}`);
      if (showShips && shipId && shot !== 'sunk') classes.push('ship', `ship-${shipId}`);
      if (revealShips && shipId && shot === null) classes.push('ship', `ship-${shipId}`);
      if (shipId && fleet && el.id === 'human-fleet' && shot !== 'hit' && shot !== 'sunk') {
        const ship = fleet.find(s => s.id === shipId);
        if (ship && ship.length > 1) {
          const index = ship.horizontal ? c - ship.col : r - ship.row;
          const pos = (index * 100) / (ship.length - 1);
          cell.style.setProperty('background-position', `${pos}% 0, center center`, 'important');
          if (!ship.horizontal) cell.style.setProperty('transform', 'rotate(90deg)', 'important');
        }
      }
      const name = classes.join(' ');
      if (cell.className !== name) cell.className = name;
    }
  }

  function renderPlacement() {
    for (const cell of placementBoard.querySelectorAll('.cell')) {
      if (cell.className !== 'cell') cell.className = 'cell';
      cell.style.removeProperty('background-position');
      cell.style.removeProperty('transform');
    }
    for (const ship of game.humanFleet) {
      if (!ship.placed) continue;
      const cells = Battleship.shipCells(ship.row, ship.col, ship.length, ship.horizontal);
      for (let i = 0; i < cells.length; i++) {
        const { r, c } = cells[i];
        const cell = placementBoard.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
        if (!cell) continue;
        cell.classList.add('ship', `ship-${ship.id}`);
        if (ship.length > 1) {
          const pos = (i * 100) / (ship.length - 1);
          cell.style.setProperty('background-position', `${pos}% 0, center center`, 'important');
          if (!ship.horizontal) cell.style.setProperty('transform', 'rotate(90deg)', 'important');
        }
      }
    }
  }

  function renderRoster() {
    rosterEl.innerHTML = '';
    for (const ship of game.humanFleet) {
      const btn = document.createElement('button');
      btn.className = 'ship-btn' + (ship.id === selectedShipId ? ' selected' : '') + (ship.placed ? ' placed' : '');
      btn.type = 'button';
      btn.textContent = `${ship.name} (${ship.length})`;
      btn.addEventListener('click', () => {
        selectedShipId = ship.id;
        renderRoster();
      });
      rosterEl.appendChild(btn);
    }
  }

  function selectedShip() {
    return game.humanFleet.find(s => s.id === selectedShipId);
  }

  function updatePreview(e) {
    clearPreview();
    if (game.phase !== 'placement' || !selectedShipId) return;
    const cell = e.target.closest('.cell');
    if (!cell) return;
    const r = Number(cell.dataset.r);
    const c = Number(cell.dataset.c);
    const ship = selectedShip();
    if (!ship) return;
    const cells = Battleship.shipCells(r, c, ship.length, horizontal);
    const valid = Battleship.canPlace(game.humanBoard, r, c, ship.length, horizontal, ship.id);
    for (const { r: rr, c: cc } of cells) {
      const el = placementBoard.querySelector(`.cell[data-r="${rr}"][data-c="${cc}"]`);
      if (el) {
        el.classList.add(valid ? 'preview-valid' : 'preview-invalid');
        previewCells.push(el);
      }
    }
  }

  function clearPreview() {
    for (const el of previewCells) el.classList.remove('preview-valid', 'preview-invalid');
    previewCells = [];
  }

  function handlePlacementClick(e) {
    if (game.phase !== 'placement') return;
    const cell = e.target.closest('.cell');
    if (!cell) return;
    const r = Number(cell.dataset.r);
    const c = Number(cell.dataset.c);
    const ship = selectedShip();
    if (!ship) {
      setStatus('Select a ship from the roster first.');
      return;
    }
    if (Battleship.canPlace(game.humanBoard, r, c, ship.length, horizontal, ship.id)) {
      Battleship.clearShip(game.humanBoard, ship);
      Battleship.placeShip(game.humanBoard, ship, r, c, horizontal);
      selectedShipId = null;
      renderPlacement();
      renderRoster();
      updateConfirm();
      setStatus(`${ship.name} placed at ${rowLabel(r)}${colLabel(c)}.`);
    } else {
      setStatus('Invalid placement. Try another cell or rotate.');
    }
  }

  function updateConfirm() {
    confirmBtn.disabled = !Battleship.allShipsPlaced(game.humanFleet);
  }

  function setStatus(msg) {
    statusEl.textContent = msg;
  }

  function toggleOrientation() {
    if (game.phase !== 'placement') return;
    horizontal = !horizontal;
    setStatus(horizontal ? 'Horizontal' : 'Vertical');
  }

  function randomize() {
    if (game.phase !== 'placement') return;
    if (Battleship.randomize(game.humanBoard, game.humanFleet)) {
      selectedShipId = null;
      renderPlacement();
      renderRoster();
      updateConfirm();
      setStatus('Fleet randomized. Confirm when ready.');
    } else {
      setStatus('Randomization failed. Try again.');
    }
  }

  function clearAll() {
    if (game.phase !== 'placement') return;
    Battleship.clearAllShips(game.humanBoard, game.humanFleet);
    selectedShipId = null;
    renderPlacement();
    renderRoster();
    updateConfirm();
    setStatus('Board cleared.');
  }

  function addLog(msg) {
    const p = document.createElement('p');
    p.textContent = msg;
    logEl.appendChild(p);
    logEl.scrollTop = logEl.scrollHeight;
    while (logEl.children.length > 50) logEl.removeChild(logEl.firstChild);
  }

  function renderShipLists() {
    function list(fleet) {
      return '<ul>' + fleet.map(s => `<li class="${s.sunk ? 'sunk' : ''}">${s.name} (${s.length})</li>`).join('') + '</ul>';
    }
    humanList.innerHTML = list(game.humanFleet);
    enemyList.innerHTML = list(game.aiFleet);
  }

  function renderBattle() {
    renderBoard(humanFleetBoard, game.humanBoard, game.aiShots, true, false, game.humanFleet);
    renderBoard(enemyWatersBoard, game.aiBoard, game.playerShots, false, game.winner !== null, game.aiFleet);
  }

  function startBattle() {
    if (!Battleship.allShipsPlaced(game.humanFleet)) return;
    if (!Battleship.randomize(game.aiBoard, game.aiFleet)) {
      setStatus('AI fleet generation failed. Try again.');
      return;
    }
    Battleship.setDifficulty(game, difficultySelect.value);
    saveSetting(STORAGE_DIFFICULTY, difficultySelect.value);
    game.phase = 'battle';
    game.winner = null;
    placementSection.classList.add('hidden');
    endScreen.classList.add('hidden');
    battleSection.classList.remove('hidden');
    logEl.innerHTML = '';
    createBoard(humanFleetBoard);
    createBoard(enemyWatersBoard);
    renderBattle();
    renderShipLists();
    addLog(`Battle started — ${game.difficulty}. Your turn.`);
    setStatus('Your turn. Fire at the enemy waters.');
  }

  function endGame() {
    inputLocked = true;
    endScreen.classList.remove('hidden');
    endTitle.textContent = game.winner === 'human' ? 'You win!' : 'You lose';
    endMessage.textContent = game.winner === 'human' ? 'All enemy ships have been sunk.' : 'Your fleet was destroyed.';
    renderBattle();
    renderShipLists();
    setStatus('Game over.');
    playSound(game.winner === 'human' ? 'win' : 'lose');
    const loserBoard = game.winner === 'human' ? enemyWatersBoard : humanFleetBoard;
    const loserGif = loserBoard.querySelector('.win-gif');
    if (loserGif) loserGif.classList.remove('hidden');
    const loserDefeated = loserBoard.querySelector('.defeated');
    if (loserDefeated) {
      setTimeout(() => {
        loserDefeated.classList.remove('hidden');
        loserDefeated.classList.add('pulse');
      }, 300);
    }
    const winnerBoard = game.winner === 'human' ? humanFleetBoard : enemyWatersBoard;
    const winnerFireworks = winnerBoard.querySelector('.fireworks');
    const winnerText = winnerBoard.querySelector('.victorious');
    if (winnerFireworks && winnerText) {
      setTimeout(() => {
        winnerFireworks.classList.remove('hidden');
        winnerFireworks.classList.add('pulse');
        winnerText.classList.remove('hidden');
        winnerText.classList.add('pulse');
      }, 300);
    }
  }

  function aiTurn() {
    if (game.winner || game.phase !== 'battle') return;
    inputLocked = true;
    setStatus('AI is targeting...');
    setTimeout(() => {
      const res = Battleship.aiTurn(game);
      if (!res) {
        inputLocked = false;
        return;
      }
      const msg = res.result === 'sunk' ? `AI ${rowLabel(res.r)}${colLabel(res.c)}: ${res.ship.name} sunk` : `AI ${rowLabel(res.r)}${colLabel(res.c)}: ${res.result}`;
      addLog(msg);
      playSound(res.result);
      renderBattle();
      renderShipLists();
      if (game.winner) {
        endGame();
      } else {
        inputLocked = false;
        setStatus('Your turn.');
      }
    }, 600);
  }

  function playerFire(r, c) {
    if (game.phase !== 'battle' || inputLocked || game.winner) return;
    const res = Battleship.playerTurn(game, r, c);
    if (res.result === 'already') {
      setStatus('You already fired there.');
      return;
    }
    const msg = res.result === 'sunk' ? `${rowLabel(r)}${colLabel(c)}: ${res.ship.name} sunk` : `${rowLabel(r)}${colLabel(c)}: ${res.result}`;
    addLog(msg);
    playSound(res.result);
    renderBattle();
    renderShipLists();
    if (game.winner) {
      endGame();
    } else {
      aiTurn();
    }
  }

  function resetGame() {
    game.difficulty = difficultySelect.value;
    Battleship.resetGame(game);
    game.winner = null;
    placementSection.classList.remove('hidden');
    battleSection.classList.add('hidden');
    endScreen.classList.add('hidden');
    placementBoard.classList.remove('locked');
    confirmBtn.disabled = true;
    rotateBtn.disabled = false;
    randomBtn.disabled = false;
    clearBtn.disabled = false;
    selectedShipId = null;
    horizontal = true;
    inputLocked = false;
    logEl.innerHTML = '';
    createBoard(placementBoard);
    createBoard(humanFleetBoard);
    createBoard(enemyWatersBoard);
    renderPlacement();
    renderRoster();
    updateConfirm();
    setStatus('Select a ship, hover the board, and click to place. Press R to rotate.');
  }

  function handleEnemyClick(e) {
    const cell = e.target.closest('.cell');
    if (!cell) return;
    const r = Number(cell.dataset.r);
    const c = Number(cell.dataset.c);
    playerFire(r, c);
  }

  rotateBtn.addEventListener('click', toggleOrientation);
  randomBtn.addEventListener('click', randomize);
  clearBtn.addEventListener('click', clearAll);
  confirmBtn.addEventListener('click', startBattle);
  newGameBtn.addEventListener('click', resetGame);
  playAgainBtn.addEventListener('click', resetGame);
  difficultySelect.addEventListener('change', () => saveSetting(STORAGE_DIFFICULTY, difficultySelect.value));
  soundToggle.addEventListener('change', () => {
    saveSetting(STORAGE_SOUND, soundToggle.checked ? 'on' : 'off');
    if (soundToggle.checked) {
      initAudio();
      playTone(880, 0.1);
      musicAudio.play().catch(() => {});
    } else {
      musicAudio.pause();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') toggleOrientation();
  });
  placementBoard.addEventListener('mouseover', updatePreview);
  placementBoard.addEventListener('mouseout', clearPreview);
  placementBoard.addEventListener('click', handlePlacementClick);
  enemyWatersBoard.addEventListener('click', handleEnemyClick);

  difficultySelect.value = loadSetting(STORAGE_DIFFICULTY, 'Medium');
  soundToggle.checked = loadSetting(STORAGE_SOUND, 'off') === 'on';

  if (soundToggle.checked) {
    musicAudio.play().catch(() => {});
  }
  document.addEventListener('click', () => {
    if (soundToggle.checked && musicAudio.paused) musicAudio.play().catch(() => {});
  }, { once: true });

  createBoard(placementBoard);
  createBoard(humanFleetBoard);
  createBoard(enemyWatersBoard);
  renderRoster();
  updateConfirm();
  setStatus('Select a ship, hover the board, and click to place. Press R to rotate.');
})();
