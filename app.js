/* =====================================================================
   Connect Four — game logic and UI wiring.
   The board is a 2D array: 0 = empty, 1 = Player 1 (gold), 2 = Player 2 (red).
   Row 0 is the TOP of the board; discs fall to the lowest empty row.
   The AI lives in ai.js (ConnectFourAI.getMove).
   ===================================================================== */

const ROWS = ConnectFourAI.ROWS;
const COLS = ConnectFourAI.COLS;
const P1 = 1;
const P2 = 2;

let board;            // 2D array of 0/1/2
let currentPlayer;    // whose turn it is
let gameOver;
let mode = 'ai-medium';   // '2p' | 'ai-easy' | 'ai-medium' | 'ai-hard'
let aiThinking = false;   // blocks clicks while the AI "thinks"
let lastMove = null;      // { row, col } of the latest disc (for the drop animation)
let winCells = [];        // the four winning cells, if someone won

// Scoreboard persists across visits via localStorage.
let scores;
try {
  scores = JSON.parse(localStorage.getItem('c4-scores')) || { p1: 0, p2: 0, draws: 0 };
} catch (e) {
  scores = { p1: 0, p2: 0, draws: 0 };
}

// ---- DOM handles ----
const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const labelP2 = document.getElementById('label-p2');

// ---- Game setup ----
function newGame() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  currentPlayer = P1;
  gameOver = false;
  aiThinking = false;
  lastMove = null;
  winCells = [];
  statusEl.classList.remove('thinking');
  setStatus("Player 1's turn — click a column to drop a disc!");
  renderBoard();
  renderScores();
}

function isAiMode() {
  return mode.startsWith('ai');
}

function aiDifficulty() {
  return mode.replace('ai-', ''); // 'easy' | 'medium' | 'hard'
}

// ---- Rendering ----
function renderBoard() {
  boardEl.innerHTML = '';
  const winSet = new Set(winCells.map(([r, c]) => r + ',' + c));

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.col = c;
      // Clicking any cell in a column drops a disc in that column.
      cell.addEventListener('click', () => handleColumnClick(c));

      const piece = board[r][c];
      if (piece !== 0) {
        const disc = document.createElement('div');
        disc.className = 'disc ' + (piece === P1 ? 'p1' : 'p2');
        // Animate only the disc that was just placed.
        if (lastMove && lastMove.row === r && lastMove.col === c) {
          disc.classList.add('drop');
          // How far it fell: one step per row above the landing row.
          const dist = (r + 1) * 68; // matches --step in styles.css
          disc.style.setProperty('--dist', dist + 'px');
        }
        if (winSet.has(r + ',' + c)) disc.classList.add('win');
        cell.appendChild(disc);
      }
      boardEl.appendChild(cell);
    }
  }
}

function renderScores() {
  document.getElementById('score-p1').textContent = scores.p1;
  document.getElementById('score-p2').textContent = scores.p2;
  document.getElementById('score-draws').textContent = scores.draws;
}

function saveScores() {
  try {
    localStorage.setItem('c4-scores', JSON.stringify(scores));
  } catch (e) {
    /* private browsing etc. — scores just won't persist */
  }
}

function setStatus(text) {
  statusEl.textContent = text;
}

// ---- Moves ----
function handleColumnClick(col) {
  if (gameOver || aiThinking) return;
  // In AI modes, Player 2's moves come from the AI, not clicks.
  if (isAiMode() && currentPlayer === P2) return;
  dropDisc(col);
}

function dropDisc(col) {
  // Find the lowest empty row in this column.
  let row = -1;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === 0) {
      row = r;
      break;
    }
  }
  if (row === -1) {
    setStatus('That column is full — pick another one!');
    return;
  }

  board[row][col] = currentPlayer;
  lastMove = { row, col };

  // Did someone just win? (ai.js exposes the same check the AI uses.)
  const result = findWin(board);
  if (result) {
    gameOver = true;
    winCells = result.cells;
    renderBoard();
    const winnerName = result.piece === P1 ? 'Player 1' : (isAiMode() ? 'The AI' : 'Player 2');
    setStatus('🎉 ' + winnerName + ' connects four — wins!');
    if (result.piece === P1) scores.p1++;
    else scores.p2++;
    saveScores();
    renderScores();
    return;
  }

  // Board full with no winner = draw.
  if (board[0].every((v) => v !== 0)) {
    gameOver = true;
    renderBoard();
    setStatus("It's a draw — nobody connects four!");
    scores.draws++;
    saveScores();
    renderScores();
    return;
  }

  // Switch turns.
  currentPlayer = currentPlayer === P1 ? P2 : P1;
  renderBoard();

  if (isAiMode() && currentPlayer === P2) {
    // Let the AI move after a short pause so it feels like it's thinking.
    aiThinking = true;
    statusEl.classList.add('thinking');
    setStatus('AI is thinking…');
    setTimeout(() => {
      aiThinking = false;
      statusEl.classList.remove('thinking');
      if (gameOver) return;
      const aiCol = ConnectFourAI.getMove(board, P2, aiDifficulty());
      if (aiCol !== null) dropDisc(aiCol);
    }, 500);
  } else {
    const name = currentPlayer === P1 ? 'Player 1' : (isAiMode() ? 'Your' : "Player 2's");
    setStatus(currentPlayer === P1 || !isAiMode()
      ? (currentPlayer === P1 ? "Player 1's" : "Player 2's") + ' turn — click a column!'
      : 'Your turn — click a column!');
  }
}

// Win detection for the UI. (ai.js has its own copy for the search;
// kept separate so each file reads on its own.)
function findWin(b) {
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const piece = b[r][c];
      if (piece === 0) continue;
      for (const [dr, dc] of directions) {
        const cells = [[r, c]];
        for (let i = 1; i < 4; i++) {
          const nr = r + dr * i;
          const nc = c + dc * i;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) break;
          if (b[nr][nc] !== piece) break;
          cells.push([nr, nc]);
        }
        if (cells.length === 4) return { piece, cells };
      }
    }
  }
  return null;
}

// ---- Controls ----
document.querySelectorAll('.modes button').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.modes button').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    mode = btn.dataset.mode;
    labelP2.textContent = isAiMode() ? 'AI' : 'Player 2';
    newGame();
  });
});

document.getElementById('btn-new').addEventListener('click', newGame);

document.getElementById('btn-reset-scores').addEventListener('click', () => {
  scores = { p1: 0, p2: 0, draws: 0 };
  saveScores();
  renderScores();
});

// ---- Go! ----
labelP2.textContent = 'AI';
newGame();
