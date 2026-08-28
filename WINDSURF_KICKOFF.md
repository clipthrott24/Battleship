# Windsurf kickoff — Battleship vs AI

Read `PRD.md` first. That file is the source of truth. Implement the **Must** scope. Do not implement Non-goals or Won’t items.

## Goal
A playable static Battleship vs AI game a reviewer can finish in the browser. Classic rules, placement + combat, Easy / Medium / Hard, clean UI, no backend.

## Build order (do not skip ahead)
1. Domain models: board, ships, placement validation, shot resolution, win check.
2. Placement UI: roster, ghost preview, rotate (`R` + button), randomize, clear, confirm locked until fleet is complete.
3. Battle UI: two boards, player shot, miss/hit/sunk, log, input lock, AI turn pause.
4. AI: Easy random; Medium hunt/target; Hard probability density + hunt/target. Never shoot a fired or already-sunk cell.
5. End game + New game + difficulty selector (default Medium).
6. Polish only after the above works: responsive stack on mobile, short animations, optional sound toggle default off.

## Constraints
- Static app only (vanilla HTML/CSS/JS preferred; small Vite build OK if documented).
- Separate game logic from DOM.
- No multiplayer, accounts, APIs, analytics, licensed Hasbro art.
- English UI. Original visual design.
- Keep files small and named clearly (`index.html`, `styles.css`, `js/game.js`, `js/ai.js`, etc. — adjust if you use a bundler).

## After each milestone
Tell me how to playtest it and which PRD requirements it covers (R1, R18, …).
Fix bugs before adding polish.

## Start now
Create the project skeleton and implement board + ship placement with validation and preview. Stop when a player can place or randomize a legal fleet and confirm.
