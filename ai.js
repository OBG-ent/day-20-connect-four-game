/* =====================================================================
   Connect Four AI — minimax with alpha-beta pruning.
   Plain-English version of how it thinks:
     1. For every column it could play, it imagines the move.
     2. Then it imagines the opponent's best reply, then its own reply,
        and so on, "depth" moves into the future (a game tree).
     3. Positions are scored: four-in-a-row = huge score, three-in-a-row
        with an open end = good, center control = slightly good.
     4. It assumes the opponent also plays perfectly, and picks the move
        whose worst-case outcome is best ("minimax").
   Alpha-beta pruning just skips branches that can't change the answer,
   so Hard mode (depth 4) still answers in well under a second.
   ===================================================================== */

const ConnectFourAI = (() => {
  const ROWS = 6;
  const COLS = 7;
  const EMPTY = 0;

  // Columns whose top cell is free are playable.
  function getValidMoves(board) {
    const moves = [];
    for (let c = 0; c < COLS; c++) {
      if (board[0][c] === EMPTY) moves.push(c);
    }
    return moves;
  }

  // Lowest empty row in a column (row 5 is the bottom).
  function getNextOpenRow(board, col) {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r][col] === EMPTY) return r;
    }
    return -1;
  }

  // Deep copy so the search never mutates the real game board.
  function copyBoard(board) {
    return board.map((row) => row.slice());
  }

  // Find any four-in-a-row. Returns { piece, cells } or null.
  function checkWinner(board) {
    const directions = [
      [0, 1],   // horizontal
      [1, 0],   // vertical
      [1, 1],   // diagonal down-right
      [1, -1],  // diagonal up-right
    ];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const piece = board[r][c];
        if (piece === EMPTY) continue;
        for (const [dr, dc] of directions) {
          const cells = [[r, c]];
          for (let i = 1; i < 4; i++) {
            const nr = r + dr * i;
            const nc = c + dc * i;
            if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) break;
            if (board[nr][nc] !== piece) break;
            cells.push([nr, nc]);
          }
          if (cells.length === 4) return { piece, cells };
        }
      }
    }
    return null;
  }

  // Score one window of 4 cells from the AI's perspective.
  function scoreWindow(window, piece) {
    const opp = piece === 1 ? 2 : 1;
    const mine = window.filter((v) => v === piece).length;
    const theirs = window.filter((v) => v === opp).length;
    const empty = window.filter((v) => v === EMPTY).length;
    if (theirs > 0) return 0;          // blocked by opponent: worthless
    if (mine === 4) return 100000;    // (safety net; terminal wins are handled above)
    if (mine === 3 && empty === 1) return 50;   // one move from winning
    if (mine === 2 && empty === 2) return 10;
    if (mine === 1 && empty === 3) return 1;
    return 0;
  }

  // Score the whole board: every possible window of 4, plus center control.
  function evaluateBoard(board, piece) {
    let score = 0;

    // Center column is valuable: the most winning lines pass through it.
    let centerCount = 0;
    for (let r = 0; r < ROWS; r++) {
      if (board[r][3] === piece) centerCount++;
    }
    score += centerCount * 6;

    // Horizontal windows.
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        score += scoreWindow([board[r][c], board[r][c + 1], board[r][c + 2], board[r][c + 3]], piece);
      }
    }
    // Vertical windows.
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r <= ROWS - 4; r++) {
        score += scoreWindow([board[r][c], board[r + 1][c], board[r + 2][c], board[r + 3][c]], piece);
      }
    }
    // Diagonal windows (down-right and up-right).
    for (let r = 0; r <= ROWS - 4; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        score += scoreWindow([board[r][c], board[r + 1][c + 1], board[r + 2][c + 2], board[r + 3][c + 3]], piece);
      }
    }
    for (let r = 3; r < ROWS; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        score += scoreWindow([board[r][c], board[r - 1][c + 1], board[r - 2][c + 2], board[r - 3][c + 3]], piece);
      }
    }
    return score;
  }

  // Try the most promising columns first (center out) — better pruning
  // and the AI plays more like a human.
  function orderMoves(moves) {
    return moves.slice().sort((a, b) => Math.abs(a - 3) - Math.abs(b - 3));
  }

  // The minimax search. Returns [bestColumn, score].
  function minimax(board, depth, alpha, beta, maximizing, aiPiece) {
    const opp = aiPiece === 1 ? 2 : 1;
    const win = checkWinner(board);
    const moves = getValidMoves(board);

    // Stop when we hit max depth, someone won, or the board is full.
    if (depth === 0 || win || moves.length === 0) {
      if (win && win.piece === aiPiece) return [null, 1000000];
      if (win && win.piece === opp) return [null, -1000000];
      return [null, evaluateBoard(board, aiPiece)];
    }

    const ordered = orderMoves(moves);

    if (maximizing) {
      // AI's turn: pick the move with the HIGHEST score.
      let value = -Infinity;
      let best = ordered[0];
      for (const col of ordered) {
        const b = copyBoard(board);
        b[getNextOpenRow(b, col)][col] = aiPiece;
        const [, newScore] = minimax(b, depth - 1, alpha, beta, false, aiPiece);
        if (newScore > value) {
          value = newScore;
          best = col;
        }
        alpha = Math.max(alpha, value);
        if (alpha >= beta) break; // opponent already has a better reply: stop looking
      }
      return [best, value];
    } else {
      // Opponent's turn: they pick the move with the LOWEST score.
      let value = Infinity;
      let best = ordered[0];
      for (const col of ordered) {
        const b = copyBoard(board);
        b[getNextOpenRow(b, col)][col] = opp;
        const [, newScore] = minimax(b, depth - 1, alpha, beta, true, aiPiece);
        if (newScore < value) {
          value = newScore;
          best = col;
        }
        beta = Math.min(beta, value);
        if (alpha >= beta) break; // AI already has a better option: stop looking
      }
      return [best, value];
    }
  }

  // Pick a column for the AI. difficulty: 'easy' | 'medium' | 'hard'.
  function getMove(board, aiPiece, difficulty) {
    const moves = getValidMoves(board);
    if (moves.length === 0) return null;

    if (difficulty === 'easy') {
      // Mostly random (beatable and fun), occasionally looks 1 move ahead
      // so it still blocks obvious wins.
      if (Math.random() < 0.75) {
        return moves[Math.floor(Math.random() * moves.length)];
      }
      return minimax(copyBoard(board), 1, -Infinity, Infinity, true, aiPiece)[0];
    }
    if (difficulty === 'medium') {
      return minimax(copyBoard(board), 3, -Infinity, Infinity, true, aiPiece)[0];
    }
    // hard: depth 4 — genuinely tough to beat.
    return minimax(copyBoard(board), 4, -Infinity, Infinity, true, aiPiece)[0];
  }

  return { getMove, ROWS, COLS };
})();
