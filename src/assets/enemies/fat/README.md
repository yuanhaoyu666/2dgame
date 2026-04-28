# Fat enemy reference sheet

`FatEnemy-Sheet.png` is a labeled reference sheet with a black background, not a clean transparent game spritesheet.

The renderer chroma-keys near-black pixels to transparent at runtime and uses manual crop rectangles from:

- `src/data/enemyAnimations.js`

If you later export clean per-animation strips, replace `FatEnemy-Sheet.png` and update the frame rectangles in that config.

Current supported actions:

- `idle`
- `walk`
- `dash`
- `punch`
- `bellySlam`
- `charge`
- `fatMissile`
- `hurt`
- `death`
- `burpJet`
- `fartShockwave`
