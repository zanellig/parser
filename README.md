# parser

Minimal parser and renderer for `.draw` files.

Core code was written by hand.

Help from GPT-5.5 was used on the lexer, refactoring into an extendable structure, and writing these docs.

To install dependencies:

```bash
pnpm install
```

Useful commands:

```bash
pnpm start -- --path examples/simple.draw --width 10 --height 5
pnpm test
pnpm run typecheck
```

## Project Structure

```text
src/
  cli/      CLI argument parsing and program entrypoint
  draw/     .draw language tokens, lexer, parser, and parse errors
  render/   Canvas state, movement rules, and output rendering
  shared/   Small generic helpers
examples/   Runnable .draw programs
test/       Tests and fixtures
```

## CLI

Run a drawing file with Node's native TypeScript support:

```bash
pnpm start -- --path examples/simple.draw --width 10 --height 5
```

Flags:

| Flag | Aliases | Required | Value |
| --- | --- | --- | --- |
| `--path` | `--file`, `-p`, `-f` | Yes | Path to a `.draw` file, relative to the current working directory. |
| `--width` | `-w` | Width or height is required | Positive integer canvas width. |
| `--height` | `-h` | Width or height is required | Positive integer canvas height. |

If only `--width` or only `--height` is provided, the canvas uses that value for both dimensions.
If the same flag appears more than once, the first value wins.

## Draw Language

A `.draw` program is a text file with one action per non-empty line.
Comments start with `#`; everything after `#` on that line is ignored.
Action tokens are uppercase and may have one non-negative integer parameter (movement requires a positive integer).
Leading indentation is invalid.

```draw
P 2   # select pen 2
D     # put pen down
E 4   # move east 4 cells
N 2   # move north 2 cells
U     # lift pen up
```

Commands:

| Command | Parameter | Meaning |
| --- | --- | --- |
| `P` | `0`, `1`, or `2` | Select pen style. The pen must be up before changing style. |
| `D` | None | Put the pen down. Movement will draw. |
| `U` | None | Lift the pen up. Movement will not draw. |
| `N` | Positive integer | Move north by that many cells. |
| `S` | Positive integer | Move south by that many cells. |
| `E` | Positive integer | Move east by that many cells. |
| `W` | Positive integer | Move west by that many cells. |

## Runtime Behavior

- The pen starts at the bottom-left corner of the canvas.
- The default pen style is `1`.
- Movement is clamped to the canvas bounds.
- While the pen is down, each movement step paints the current cell before moving to the next cell.
- Output is printed to stdout from top row to bottom row.
- Pixel styles are `░░` for empty cells and pen `0`, `▓▓` for pen `1`, and `██` for pen `2`.
