# Battleship vs AI — Product Requirements Document

**Product:** Battleship vs AI (browser game)  
**Owner:** Candidate  
**Audience:** Cognition hiring reviewers + implementation agents (Devin / Windsurf)  
**Date:** 2026-08-27  
**Status:** Draft  
**Version:** 1.0  
**Primary deliverables:** playable public URL, public GitHub repo, short bugs document  

---

## 1. Overview

Build a complete, polished Battleship game that a reviewer can play in the browser against an AI opponent. The game must follow classic Battleship rules, support ship placement and turn-based combat, include three distinct AI difficulties, and ship as a static web app (no backend).

Reviewers should be able to:

1. Open a public URL and finish a full game on desktop or phone.
2. Open a public GitHub repo and read the code.
3. Read a short document of bugs found during playtesting and how they were fixed.

This is a take-home demonstration of product judgment, engineering craft, and AI-assisted velocity. Quality bar: correct rules, fair-feeling AI, clean UI, no obvious bugs.

---

## 2. Problem / context

Hiring reviewers are asked to evaluate candidates who claim they can ship with Devin and Windsurf. A half-finished grid or a random-only AI does not prove that. They need a game that:

- Is immediately playable without setup beyond opening a link.
- Implements real game logic, not a thin demo.
- Has an opponent that is fun on Easy and threatening on Hard.
- Shows the candidate can find and fix edge-case bugs, not just generate a first draft.

Current default solutions (tutorial clones) usually fail on placement validation, last-ship win timing, mobile tap double-fires, and AI that keeps shooting sunk ships.

---

## 3. Goals

**G1.** A reviewer can complete at least one full game vs AI from a public URL in under 10 minutes.  
**G2.** Classic rules are implemented correctly; invalid states are impossible from the UI.  
**G3.** Easy / Medium / Hard AI are recognizably different within one game each.  
**G4.** The UI is usable on a laptop and a phone-width viewport without horizontal chaos.  
**G5.** Code is readable, public, and deployable as static files.  
**G6.** A short `BUGS.md` lists real issues found in playtesting and the fix for each.

### Non-goals (explicit)

- Human vs human / online multiplayer / rooms / matchmaking  
- User accounts, cloud save, global leaderboards  
- Native iOS/Android apps  
- Backend, databases, websockets  
- Campaign mode, power-ups, custom ship editors, fog-of-war variants  
- Pixel-perfect recreation of Hasbro branding or copyrighted assets  
- Automated CI game-play bots as a launch blocker (unit tests for logic are welcome)

---

## 4. Users and jobs

| User | Job |
|---|---|
| Hiring reviewer | Open link, play, judge quality and taste |
| Candidate (builder) | Implement against a stable spec; playtest; document bugs |
| Devin / Windsurf | Implement behavior from numbered requirements without inventing scope |

No marketing personas needed.

---

## 5. Game rules (source of truth)

**Board:** 10×10. Rows labeled A–J or 1–10; columns labeled 1–10 or A–J. Labels must be visible and consistent on both boards.

**Fleet (each side, standard):**

| Ship | Length |
|---|---|
| Carrier | 5 |
| Battleship | 4 |
| Cruiser | 3 |
| Submarine | 3 |
| Destroyer | 2 |

**Placement rules:**

- Ships occupy contiguous orthogonal cells only (no diagonals).
- Ships may be horizontal or vertical.
- Ships may not overlap.
- Ships may not hang off the board.
- Adjacent touching is allowed (no “no-touch” house rule).
- Once battle starts, player ships are locked.

**Combat rules:**

- Players alternate turns. Human shoots first after placement.
- A turn is exactly one shot at a previously un-fired cell on the opponent board.
- Shot results: **Miss**, **Hit**, or **Sunk** (hit that finishes a ship).
- Sunk is announced immediately and the ship identity may be shown (“You sunk the Cruiser”).
- Firing a cell that was already tried is illegal and must not consume the turn.
- Winner is the first player to sink all five opponent ships.
- Game ends immediately when the last opposing ship is sunk (no extra “cleanup” turn).

**AI fleet:** placed automatically with the same legal constraints before battle. Human never sees AI ship locations except via hits/sinks (and an optional end-game reveal).

---

## 6. User flows

### F1. Landing

Player sees title, short rules blurb, difficulty selector (default **Medium**), optional sound toggle (default off or on—implementation choice, but persist in `localStorage` if present), and **Place ships** / **Start**.

### F2. Placement

- Human board is interactive; AI board is hidden or labeled “Enemy waters — locked until battle.”
- Player places all five ships.
- Supported methods (at least one complete method required; both preferred):
  - **Click-to-place:** select ship from a roster, hover/tap preview ghost, click to commit, control to rotate (button + `R` key).
  - **Randomize:** legal random layout in one click.
- Ghost preview is valid (neutral/green) or invalid (red) before commit.
- Player can reset board or randomize again until they confirm.
- **Confirm / Engage** is disabled until all five ships are placed legally.
- After confirm, phase switches to battle.

### F3. Battle

- Two boards: **Your fleet** (shows own ships + AI shots) and **Enemy waters** (shows only player shots).
- Player clicks/taps an untried enemy cell to fire.
- Result animates and is written to a compact log (“B4 hit,” “G7 miss,” “Cruiser sunk”).
- Input is locked until the shot resolves and the AI has taken its shot (or game ends).
- AI turn shows a brief “targeting…” state (200–800 ms) so the turn is perceptible.
- Remaining ships / sunk ships are listed for both sides without revealing unsunk enemy positions.

### F4. End game

- Modal or banner: You win / You lose.
- Show final boards (optional: reveal remaining AI ships on loss or always on end).
- Actions: **Play again** (same difficulty, new placements) and change difficulty.

---

## 7. Functional requirements

### Placement

- **R1.** The system shall provide a 10×10 human board and a 10×10 enemy board.
- **R2.** The system shall require the standard five-ship fleet on each side.
- **R3.** When the player attempts to place a ship, the system shall accept the placement only if every cell is on-board and unoccupied.
- **R4.** The system shall show a live placement preview that communicates valid vs invalid before commit.
- **R5.** The player shall be able to rotate the active ship between horizontal and vertical.
- **R6.** The player shall be able to randomize a fully legal layout.
- **R7.** The player shall be able to clear placements and start placement over.
- **R8.** Battle shall not start until all five human ships are placed.
- **R9.** After battle starts, human ships cannot be moved.

### Combat

- **R10.** When the player selects an untried enemy cell during their turn, the system shall resolve Miss, Hit, or Sunk and then pass the turn to the AI unless the game is over.
- **R11.** The system shall ignore or reject shots at cells already marked hit or miss and shall not advance the turn.
- **R12.** When a shot occupies the last remaining cell of a ship, the system shall mark that ship sunk immediately and notify the player which ship was sunk.
- **R13.** When all five ships of one side are sunk, the system shall end the game immediately and declare a winner.
- **R14.** The human board shall display AI misses, hits, and sunk ships on the player’s fleet.
- **R15.** The enemy board shall display only the player’s misses, hits, and sunk ships.

### AI

- **R16.** The player shall be able to choose Easy, Medium, or Hard before a game. Changing difficulty mid-battle is not required.
- **R17. Easy:** AI shall fire uniformly at random among remaining legal cells. No hunt logic required.
- **R18. Medium:** AI shall fire at random until it scores a hit, then hunt orthogonally adjacent untried cells, then follow the hit line when two or more hits suggest an axis, until that ship is sunk. After a sink, it shall return to hunt/random among remaining cells and shall not deliberately fire known-sunk cells.
- **R19. Hard:** AI shall prefer cells with higher probability given remaining ship lengths and remaining legal placements (density / occupancy map). After a hit it shall use the same hunt/target behavior as Medium, informed by remaining lengths. A small amount of randomness is allowed so it does not feel psychic. Parity (checkerboard) may be used while hunting.
- **R20.** AI shall never fire a cell it has already fired.
- **R21.** AI shall never fire a cell that belongs to a ship it has already sunk.
- **R22.** AI ship placement shall be a legal random layout using the same constraints as the player.

### Session / meta

- **R23.** The player shall be able to start a new game after win, loss, or from a header control (with confirm if a battle is in progress).
- **R24.** Sound, if implemented, shall be togglable and must not be required to play.
- **R25.** Difficulty and sound preference may persist in `localStorage`.
- **R26.** The game shall work without a network connection after the page has loaded (no runtime API dependency).

---

## 8. UX requirements

- **U1.** Visual hierarchy: enemy board is the primary action surface during battle; human board is status.
- **U2.** Cell states must be distinguishable without color alone if possible: empty, preview-valid, preview-invalid, occupied (own ships), miss, hit, sunk.
- **U3.** Sunk ships should read as finished (e.g., filled outline or distinct mark on every cell of that ship).
- **U4.** Touch targets on mobile should be large enough to tap a cell without frequent mis-taps; boards may stack vertically on narrow viewports.
- **U5.** Keyboard: `R` rotates during placement; optional arrow + enter is nice-to-have, not required.
- **U6.** Motion is short (shot flash, sink pulse). No motion that blocks input for more than ~800 ms except the AI thinking pause.
- **U7.** Copy is plain English. No lorem ipsum. No “click here” dead controls.
- **U8.** Theme: original naval / dark / high-contrast look. Do not copy trademarked Hasbro/Milton Bradley art.

---

## 9. Non-functional requirements

- **N1.** Static deploy: GitHub Pages or equivalent. No server-side game logic.
- **N2.** Supported browsers: latest Chrome, Firefox, Safari (desktop + iOS). No IE.
- **N3.** First useful paint should be immediate on a normal connection; no heavy framework required. Vanilla HTML/CSS/JS is preferred. A small build (Vite) is acceptable if the repo documents how to build and the Pages artifact is static.
- **N4.** Game logic (boards, ships, shots, win check, AI legal moves) should be separated from DOM code so it can be reasoned about and lightly tested.
- **N5.** No secrets, tracking pixels, or analytics SDKs.
- **N6.** Accessibility baseline: buttons are real buttons, boards have labels, status text is available to screen readers for last shot result.

---

## 10. Scope (MoSCoW)

**Must**

- Rules R1–R22 and flows F1–F4  
- Easy / Medium / Hard  
- Placement preview + rotate + randomize  
- Public URL + public repo + `README.md` + `BUGS.md`

**Should**

- Shot / sink animations  
- Turn log  
- Sound toggle  
- End-game reveal of remaining AI ships  
- Responsive stacked layout  

**Could**

- Hard-mode optional heat-map debug overlay (off by default)  
- Placement drag-and-drop in addition to click-to-place  
- Subtle water / grid ambience  
- Local “games played / win rate” stats  

**Won’t (this version)**

- Multiplayer, accounts, backend, custom rulesets, 3D, licensed IP

---

## 11. Definition of done

The work is done when all of the following are true:

1. A stranger can open the public URL and finish a game vs Medium without instructions beyond what’s on the page.  
2. Easy feels weaker than Medium; Hard feels stronger than Medium across a few games.  
3. These edge cases pass in manual playtest:
   - Cannot place overlapping ships or off-board ships.
   - Cannot rotate a ship into an illegal cell and commit.
   - Cannot fire the same enemy cell twice.
   - Sinking the last ship ends the game on that shot.
   - AI does not keep targeting a sunk ship’s cells.
   - Rapid double-tap does not spend two player shots.
4. README explains how to run locally and where the live game is.  
5. `BUGS.md` lists at least the real issues found while playtesting this build (not generic placeholders).  
6. Repo is public and the live link matches the repo’s shipped code.

---

## 12. Success metrics (take-home version)

There is no production telemetry. Treat these as review heuristics:

| Signal | Pass |
|---|---|
| Time-to-first-shot | Reviewer places fleet (or randomizes) and fires within 2 minutes |
| Rules trust | No illegal placement or double-shot possible |
| AI quality | Hard wins more than Easy against the same human in repeated play |
| Polish | No broken layout at 375px width; no unlabeled buttons |
| Engineering | Logic is not one 2,000-line `index.html` soup without structure |

---

## 13. Assumptions

- A1. Single human vs one AI on one device.  
- A2. Standard Hasbro-style rules as specified here; no “ships cannot touch” variant.  
- A3. Human always places first and shoots first.  
- A4. English UI.  
- A5. Candidate may use Devin and/or Windsurf but may not have another person write or edit code.  
- A6. Original code and original visual design.

---

## 14. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Hard AI feels omniscient | Probability map + hunt/target, plus small random tie-break; never peek at the true human board except through shots |
| Medium AI loops on a hit cluster after sink | Clear target queue on sink; remove sunk cells from consideration |
| Mobile double-fire | Input lock from click until player turn returns |
| Placement UX too fiddly | Required Randomize path so reviewers can skip fiddly placement |
| Over-scope polish | Ship Must first; animations are Should |

---

## 15. Open questions (resolved defaults)

| Question | Default unless changed |
|---|---|
| Sound default | Off |
| Adjacent ships allowed | Yes |
| Reveal AI ships on win | Optional; reveal on loss recommended |
| Coordinate origin | Columns 1–10, rows A–J |
| Default difficulty | Medium |

---

## 16. Deliverable packaging

Repo root should include:

- App source (`index.html` + CSS/JS modules, or a small Vite app)  
- `README.md` — what it is, how to run, live URL, how AI difficulties work  
- `PRD.md` — this document  
- `BUGS.md` — dated list: bug, how it showed up, fix  
- License (MIT acceptable)

Live URL must load the game without cloning the repo.

---

## 17. Out of scope for the PRD (belongs in tool prompt)

Build order, file layout, library choice (unless it violates N1/N3), commit message style, and “don’t invent extra modes” are kickoff-prompt concerns, not product requirements.

---

## Changelog

| Version | Date | Notes |
|---|---|---|
| 1.0 | 2026-08-27 | Initial full PRD for Cognition take-home Battleship vs AI |
