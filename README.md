# Calculator Plugin for LM Studio

A scientific calculator plugin for LM Studio that gives models reliable math capabilities.

## Features

- Basic arithmetic: `+`, `-`, `*`, `/`
- Parentheses: `( )`
- Modulo: `%`
- Powers: `^`, `pow(x, y)`
- Roots: `sqrt(x)`, `cbrt(x)`
- Trigonometry in degrees: `sin`, `cos`, `tan`
- Inverse trigonometry: `asin`, `acos`, `atan`
- Logarithms: `log`, `ln`, `log2`, `logn(base, x)`
- Rounding and helpers: `abs`, `ceil`, `floor`, `round`, `trunc`, `sign`
- Hyperbolic functions
- Factorial: `factorial(n)` and `n!`
- Constants: `pi`, `e`, `inf`
- Previous result reference: `ans`

## Examples

- `80^2`
- `sqrt(144)`
- `sin(90)`
- `log(1000)`
- `factorial(5)`
- `sqrt(sin(45)^2 + cos(45)^2)`

## Notes

- Trigonometric functions use degrees.
- The plugin is designed as a tool provider for LM Studio.
- Models should use this tool for math instead of mental calculation.
