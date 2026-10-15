# 🔴 Connect Four 🟡

**The classic Connect Four — play a friend, or take on a minimax AI that actually thinks ahead. Can you beat Hard mode?**

Drop discs into the 7×6 grid. First to connect four — horizontally, vertically, or diagonally — wins. The AI opponent uses the **minimax algorithm with alpha-beta pruning**, the same family of ideas behind classic chess engines.

## ✨ Features

- **3 AI difficulties** — Easy (playful and beatable), Medium (thinks 3 moves ahead), Hard (thinks 4 moves ahead — genuinely tough)
- **Local 2-player mode** for playing with a friend
- **Animated disc drops** with a satisfying fall
- **Winning discs glow** so you can see exactly how the game ended
- **Persistent scoreboard** — wins and draws saved in `localStorage`
- **Full column handling** — tells you to pick another column instead of breaking
- Clean, commented code that explains minimax in plain English

## 🚀 Run it in 30 seconds

No build step, no dependencies, no server.

1. Download or clone this repo
2. Open `index.html` in any browser
3. Pick a mode and click a column to drop your first disc

That's it.

## 🤖 How the AI works

For every move, the AI builds a **game tree**: it imagines its move, your best reply, its reply, and so on — 4 moves deep on Hard. Each future board is scored (four-in-a-row = huge, three-in-a-row = good, center control = nice), and it assumes *you* play perfectly too, picking the move whose worst case is best. **Alpha-beta pruning** skips branches that can't change the answer, keeping Hard mode fast.

Try it: on Hard, the AI blocks your traps and sets its own. Beat it and you've earned the bragging rights. 🏆

## 🧠 What was practiced

- 2D grid game logic (drop physics, win detection in 4 directions)
- The **minimax algorithm** and **alpha-beta pruning**
- Heuristic board evaluation (scoring "windows" of 4 cells)
- DOM rendering and event delegation
- CSS keyframe animations
- `localStorage` persistence

## 📁 Files

- `index.html` — page structure
- `styles.css` — theme, board, disc animations
- `app.js` — game rules, turns, scoreboard, UI wiring
- `ai.js` — the minimax AI (heavily commented — start here if you're learning!)

---

*Day 20 (featured build) of a daily coding journey — one project shipped every day.*
