# Player sprite sheets

The player renderer uses `src/data/playerAnimations.js` for all animation slicing and placement.

All imported Soldier sheets currently use equal-width frames:

| Animation | File | frameWidth | frameHeight | frameCount |
| --- | --- | ---: | ---: | ---: |
| idle | Soldier-Idle.png | 100 | 100 | 6 |
| walk | Soldier-Walk.png | 100 | 100 | 8 |
| attack1 | Soldier-Attack01.png | 100 | 100 | 6 |
| attack2 | Soldier-Attack02.png | 100 | 100 | 6 |
| attack3 | Soldier-Attack03.png | 100 | 100 | 9 |
| hurt | Soldier-Hurt.png | 100 | 100 | 4 |
| death | Soldier-Death.png | 100 | 100 | 4 |
| shadow | Soldier-Shadow.png | 100 | 100 | 1 |
| attack shadow | Soldier-Shadow_attack2.png | 100 | 100 | 6 |

To tune placement, edit each animation in `src/data/playerAnimations.js`:

- `frameWidth`, `frameHeight`: source frame size inside the sheet.
- `frameCount`: number of frames in the horizontal sheet.
- `fps`: playback speed.
- `scale`: rendered size multiplier.
- `offsetX`, `offsetY`: rendered-pixel offset from the player's collision-box foot point.
- `duration`: one-shot animation duration for attack, hurt, and death.

The collision box still comes from `Player.js`; sprite size does not affect physics.
