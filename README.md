# Battleship vs AI

A static, browser-only Battleship game against an AI with Easy, Medium, and Hard difficulty levels.

## Play

Open `index.html` in any modern browser, or serve the folder with a local web server:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Live URL

Replace with your GitHub Pages / Netlify URL once deployed.

## How to play

1. **Placement:** Place your ships on the board. Click a ship name to select it, then click cells to place it. Use the **Rotate** button or press `R` to rotate. **Randomize** will place all ships legally. Click **Confirm** when ready.
2. **Battle:** Click a cell on the enemy board to fire. The AI will take its turn after a short pause.
3. **Win:** Sink all enemy ships before the AI sinks yours.

## AI difficulty

- **Easy:** Random targeting.
- **Medium:** Hunt/target mode — after a hit, it targets adjacent cells until the ship is sunk.
- **Hard:** Density map plus hunt/target — it prioritizes cells that could belong to the most remaining ship layouts.

## Sound

Sound effects and background music are off by default. Turn on the Sound toggle to enable them.
