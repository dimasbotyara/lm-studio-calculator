import { tool, ToolsProviderController } from "@lmstudio/sdk";
import { z } from "zod";

// Store last result for "ans" support
let lastResult: number = 0;

// Degree-based trig functions
const degToRad = (deg: number) => (deg * Math.PI) / 180;
const radToDeg = (rad: number) => (rad * 180) / Math.PI;

const sinDeg = (deg: number) => Math.sin(degToRad(deg));
const cosDeg = (deg: number) => Math.cos(degToRad(deg));
const tanDeg = (deg: number) => Math.tan(degToRad(deg));

// Inverse trig — return degrees
const asinDeg = (x: number) => radToDeg(Math.asin(x));
const acosDeg = (x: number) => radToDeg(Math.acos(x));
const atanDeg = (x: number) => radToDeg(Math.atan(x));

// Factorial
function factorial(n: number): number {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error(`Factorial is only defined for non-negative integers, got: ${n}`);
  }
  if (n > 170) {
    throw new Error(`Factorial of ${n} is too large to compute`);
  }
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

// Custom log base N: logN(base, x)
function logBase(base: number, x: number): number {
  return Math.log(x) / Math.log(base);
}

// All available functions mapped by name
const mathFunctions: Record<string, (...args: number[]) => number> = {
  // Basic
  abs: Math.abs,
  ceil: Math.ceil,
  floor: Math.floor,
  round: Math.round,
  trunc: Math.trunc,
  sign: Math.sign,

  // Powers & roots
  sqrt: Math.sqrt,
  cbrt: Math.cbrt,
  pow: Math.pow,
  exp: Math.exp,

  // Logarithms
  log: Math.log10,       // log(x)  = log base 10
  ln: Math.log,          // ln(x)   = natural log
  log2: Math.log2,       // log2(x) = log base 2
  logn: logBase,         // logn(base, x)

  // Trigonometry (degrees)
  sin: sinDeg,
  cos: cosDeg,
  tan: tanDeg,
  asin: asinDeg,
  acos: acosDeg,
  atan: atanDeg,

  // Hyperbolic
  sinh: Math.sinh,
  cosh: Math.cosh,
  tanh: Math.tanh,
  asinh: Math.asinh,
  acosh: Math.acosh,
  atanh: Math.atanh,

  // Other
  factorial: factorial,
  min: Math.min,
  max: Math.max,
};

function calculate(expression: string): number {
  let expr = expression
    .trim()
    .replace(/\s+/g, "")
    .replace(/,/g, ".");

  // Replace constants
  // Use word boundaries to avoid replacing "e" inside function names like "ceil"
  expr = expr.replace(/\bpi\b/gi, `(${Math.PI})`);
  expr = expr.replace(/\be\b/gi, `(${Math.E})`);
  expr = expr.replace(/\bans\b/gi, `(${lastResult})`);
  expr = expr.replace(/\binf\b/gi, "Infinity");

  // Replace ^ with **
  expr = expr.replace(/\^/g, "**");

  // Replace ! for factorial: e.g. "5!" → "fn_factorial(5)"
  // Handles number! and )!
  expr = expr.replace(/(\d+)!/g, "fn_factorial($1)");
  expr = expr.replace(/\)!/g, ")__FACT__");

  // Replace function names with prefixed versions to avoid conflicts
  const fnNames = Object.keys(mathFunctions);
  // Sort by length descending so "factorial" is matched before "floor" etc.
  fnNames.sort((a, b) => b.length - a.length);

  for (const name of fnNames) {
    const regex = new RegExp(`\\b${name}\\(`, "g");
    expr = expr.replace(regex, `fn_${name}(`);
  }

  // Handle )! for factorial of grouped expressions
  expr = expr.replace(/__FACT__/g, "");
  // We need a different approach for )! — let's skip for now, factorial(expr) is enough

  // Validate: only allow safe characters
  const safePattern = /^[0-9+\-*/().%,fn_a-zA-Z\s]+$/;
  if (!safePattern.test(expr)) {
    throw new Error(`Expression contains invalid characters: "${expression}"`);
  }

  // Build function arguments for the Function constructor
  const fnParamNames: string[] = [];
  const fnParamValues: ((...args: number[]) => number)[] = [];

  for (const name of fnNames) {
    fnParamNames.push(`fn_${name}`);
    fnParamValues.push(mathFunctions[name]);
  }

  const fn = new Function(
    ...fnParamNames,
    `"use strict"; return (${expr});`
  );

  const result = fn(...fnParamValues);

  if (typeof result !== "number") {
    throw new Error(`Expression did not return a number: "${expression}"`);
  }

  if (isNaN(result)) {
    throw new Error(`Result is NaN (not a number) for: "${expression}"`);
  }

  return result;
}

export async function toolsProvider(_ctl: ToolsProviderController) {
  const calculatorTool = tool({
    name: "calculate",
    description: `
      Evaluates a mathematical expression and returns the numeric result.
      Always use this tool for ANY math — never compute in your head.

      BASIC ARITHMETIC:
        +, -, *, /              e.g. "3 + 5 * 2" → 13
        %                       modulo, e.g. "10 % 3" → 1
        ^                       power, e.g. "2^10" → 1024
        ( )                     grouping, e.g. "(3 + 5) * 2" → 16

      FUNCTIONS:
        sqrt(x)                 square root, e.g. "sqrt(144)" → 12
        cbrt(x)                 cube root, e.g. "cbrt(27)" → 3
        pow(x, y)               x to the power of y, e.g. "pow(2, 10)" → 1024
        exp(x)                  e^x, e.g. "exp(1)" → 2.718...
        abs(x)                  absolute value, e.g. "abs(-5)" → 5
        ceil(x)                 round up, e.g. "ceil(4.2)" → 5
        floor(x)                round down, e.g. "floor(4.8)" → 4
        round(x)                round to nearest, e.g. "round(4.5)" → 5
        trunc(x)                truncate decimal, e.g. "trunc(4.9)" → 4
        sign(x)                 sign of number: -1, 0, or 1
        min(a, b, ...)          minimum value, e.g. "min(3, 1, 5)" → 1
        max(a, b, ...)          maximum value, e.g. "max(3, 1, 5)" → 5

      LOGARITHMS:
        log(x)                  log base 10, e.g. "log(1000)" → 3
        ln(x)                   natural log, e.g. "ln(e)" → 1
        log2(x)                 log base 2, e.g. "log2(256)" → 8
        logn(base, x)           log with custom base, e.g. "logn(3, 81)" → 4

      TRIGONOMETRY (all in degrees):
        sin(x), cos(x), tan(x)           e.g. "sin(90)" → 1
        asin(x), acos(x), atan(x)        inverse, returns degrees, e.g. "asin(1)" → 90

      HYPERBOLIC:
        sinh(x), cosh(x), tanh(x)
        asinh(x), acosh(x), atanh(x)

      FACTORIAL:
        factorial(n)            e.g. "factorial(5)" → 120
        5!                      shorthand, e.g. "5!" → 120

      CONSTANTS:
        pi                      3.14159...
        e                       2.71828...
        inf                     Infinity

      SPECIAL:
        ans                     result of the previous calculation

      COMPLEX EXAMPLES:
        "sqrt(sin(45)^2 + cos(45)^2)"    → 1
        "log(10^5)"                       → 5
        "factorial(10) / factorial(7)"    → 720
        "abs(sin(180) - cos(0))"          → 1
    `,
    parameters: {
      expression: z.string().describe(
        "The mathematical expression to evaluate, e.g. 'sqrt(2^8 + sin(30) * 10)'"
      ),
    },
    implementation: async ({ expression }, { status }) => {
      status(`Calculating: ${expression}`);

      try {
        const result = calculate(expression);

        // Store for "ans"
        lastResult = result;

        // Clean up floating point noise
        const rounded = parseFloat(result.toPrecision(12));

        return {
          expression,
          result: rounded,
          hint: "You can reference this result in the next calculation using 'ans'.",
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return `Error: ${message}. Please check the expression and try again.`;
      }
    },
  });

  return [calculatorTool];
}
