"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// .lmstudio/extensions/plugins/dimasbotyara/calculator/src/toolsProvider.ts
function factorial(n) {
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
function logBase(base, x) {
  return Math.log(x) / Math.log(base);
}
function calculate(expression) {
  let expr = expression.trim().replace(/\s+/g, "").replace(/,/g, ".");
  expr = expr.replace(/\bpi\b/gi, `(${Math.PI})`);
  expr = expr.replace(/\be\b/gi, `(${Math.E})`);
  expr = expr.replace(/\bans\b/gi, `(${lastResult})`);
  expr = expr.replace(/\binf\b/gi, "Infinity");
  expr = expr.replace(/\^/g, "**");
  expr = expr.replace(/(\d+)!/g, "fn_factorial($1)");
  expr = expr.replace(/\)!/g, ")__FACT__");
  const fnNames = Object.keys(mathFunctions);
  fnNames.sort((a, b) => b.length - a.length);
  for (const name of fnNames) {
    const regex = new RegExp(`\\b${name}\\(`, "g");
    expr = expr.replace(regex, `fn_${name}(`);
  }
  expr = expr.replace(/__FACT__/g, "");
  const safePattern = /^[0-9+\-*/().%,fn_a-zA-Z\s]+$/;
  if (!safePattern.test(expr)) {
    throw new Error(`Expression contains invalid characters: "${expression}"`);
  }
  const fnParamNames = [];
  const fnParamValues = [];
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
async function toolsProvider(_ctl) {
  const calculatorTool = (0, import_sdk.tool)({
    name: "calculate",
    description: `
      Evaluates a mathematical expression and returns the numeric result.
      Always use this tool for ANY math \u2014 never compute in your head.

      BASIC ARITHMETIC:
        +, -, *, /              e.g. "3 + 5 * 2" \u2192 13
        %                       modulo, e.g. "10 % 3" \u2192 1
        ^                       power, e.g. "2^10" \u2192 1024
        ( )                     grouping, e.g. "(3 + 5) * 2" \u2192 16

      FUNCTIONS:
        sqrt(x)                 square root, e.g. "sqrt(144)" \u2192 12
        cbrt(x)                 cube root, e.g. "cbrt(27)" \u2192 3
        pow(x, y)               x to the power of y, e.g. "pow(2, 10)" \u2192 1024
        exp(x)                  e^x, e.g. "exp(1)" \u2192 2.718...
        abs(x)                  absolute value, e.g. "abs(-5)" \u2192 5
        ceil(x)                 round up, e.g. "ceil(4.2)" \u2192 5
        floor(x)                round down, e.g. "floor(4.8)" \u2192 4
        round(x)                round to nearest, e.g. "round(4.5)" \u2192 5
        trunc(x)                truncate decimal, e.g. "trunc(4.9)" \u2192 4
        sign(x)                 sign of number: -1, 0, or 1
        min(a, b, ...)          minimum value, e.g. "min(3, 1, 5)" \u2192 1
        max(a, b, ...)          maximum value, e.g. "max(3, 1, 5)" \u2192 5

      LOGARITHMS:
        log(x)                  log base 10, e.g. "log(1000)" \u2192 3
        ln(x)                   natural log, e.g. "ln(e)" \u2192 1
        log2(x)                 log base 2, e.g. "log2(256)" \u2192 8
        logn(base, x)           log with custom base, e.g. "logn(3, 81)" \u2192 4

      TRIGONOMETRY (all in degrees):
        sin(x), cos(x), tan(x)           e.g. "sin(90)" \u2192 1
        asin(x), acos(x), atan(x)        inverse, returns degrees, e.g. "asin(1)" \u2192 90

      HYPERBOLIC:
        sinh(x), cosh(x), tanh(x)
        asinh(x), acosh(x), atanh(x)

      FACTORIAL:
        factorial(n)            e.g. "factorial(5)" \u2192 120
        5!                      shorthand, e.g. "5!" \u2192 120

      CONSTANTS:
        pi                      3.14159...
        e                       2.71828...
        inf                     Infinity

      SPECIAL:
        ans                     result of the previous calculation

      COMPLEX EXAMPLES:
        "sqrt(sin(45)^2 + cos(45)^2)"    \u2192 1
        "log(10^5)"                       \u2192 5
        "factorial(10) / factorial(7)"    \u2192 720
        "abs(sin(180) - cos(0))"          \u2192 1
    `,
    parameters: {
      expression: import_zod.z.string().describe(
        "The mathematical expression to evaluate, e.g. 'sqrt(2^8 + sin(30) * 10)'"
      )
    },
    implementation: async ({ expression }, { status }) => {
      status(`Calculating: ${expression}`);
      try {
        const result = calculate(expression);
        lastResult = result;
        const rounded = parseFloat(result.toPrecision(12));
        return {
          expression,
          result: rounded,
          hint: "You can reference this result in the next calculation using 'ans'."
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return `Error: ${message}. Please check the expression and try again.`;
      }
    }
  });
  return [calculatorTool];
}
var import_sdk, import_zod, lastResult, degToRad, radToDeg, sinDeg, cosDeg, tanDeg, asinDeg, acosDeg, atanDeg, mathFunctions;
var init_toolsProvider = __esm({
  ".lmstudio/extensions/plugins/dimasbotyara/calculator/src/toolsProvider.ts"() {
    "use strict";
    import_sdk = require("@lmstudio/sdk");
    import_zod = require("zod");
    lastResult = 0;
    degToRad = (deg) => deg * Math.PI / 180;
    radToDeg = (rad) => rad * 180 / Math.PI;
    sinDeg = (deg) => Math.sin(degToRad(deg));
    cosDeg = (deg) => Math.cos(degToRad(deg));
    tanDeg = (deg) => Math.tan(degToRad(deg));
    asinDeg = (x) => radToDeg(Math.asin(x));
    acosDeg = (x) => radToDeg(Math.acos(x));
    atanDeg = (x) => radToDeg(Math.atan(x));
    mathFunctions = {
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
      log: Math.log10,
      // log(x)  = log base 10
      ln: Math.log,
      // ln(x)   = natural log
      log2: Math.log2,
      // log2(x) = log base 2
      logn: logBase,
      // logn(base, x)
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
      factorial,
      min: Math.min,
      max: Math.max
    };
  }
});

// .lmstudio/extensions/plugins/dimasbotyara/calculator/src/index.ts
var src_exports = {};
__export(src_exports, {
  main: () => main
});
async function main(context) {
  context.withToolsProvider(toolsProvider);
}
var init_src = __esm({
  ".lmstudio/extensions/plugins/dimasbotyara/calculator/src/index.ts"() {
    "use strict";
    init_toolsProvider();
  }
});

// .lmstudio/extensions/plugins/dimasbotyara/calculator/.lmstudio/entry.ts
var import_sdk2 = require("@lmstudio/sdk");
var clientIdentifier = process.env.LMS_PLUGIN_CLIENT_IDENTIFIER;
var clientPasskey = process.env.LMS_PLUGIN_CLIENT_PASSKEY;
var baseUrl = process.env.LMS_PLUGIN_BASE_URL;
var client = new import_sdk2.LMStudioClient({
  clientIdentifier,
  clientPasskey,
  baseUrl
});
globalThis.__LMS_PLUGIN_CONTEXT = true;
var predictionLoopHandlerSet = false;
var promptPreprocessorSet = false;
var configSchematicsSet = false;
var globalConfigSchematicsSet = false;
var toolsProviderSet = false;
var generatorSet = false;
var selfRegistrationHost = client.plugins.getSelfRegistrationHost();
var pluginContext = {
  withPredictionLoopHandler: (generate) => {
    if (predictionLoopHandlerSet) {
      throw new Error("PredictionLoopHandler already registered");
    }
    if (toolsProviderSet) {
      throw new Error("PredictionLoopHandler cannot be used with a tools provider");
    }
    predictionLoopHandlerSet = true;
    selfRegistrationHost.setPredictionLoopHandler(generate);
    return pluginContext;
  },
  withPromptPreprocessor: (preprocess) => {
    if (promptPreprocessorSet) {
      throw new Error("PromptPreprocessor already registered");
    }
    promptPreprocessorSet = true;
    selfRegistrationHost.setPromptPreprocessor(preprocess);
    return pluginContext;
  },
  withConfigSchematics: (configSchematics) => {
    if (configSchematicsSet) {
      throw new Error("Config schematics already registered");
    }
    configSchematicsSet = true;
    selfRegistrationHost.setConfigSchematics(configSchematics);
    return pluginContext;
  },
  withGlobalConfigSchematics: (globalConfigSchematics) => {
    if (globalConfigSchematicsSet) {
      throw new Error("Global config schematics already registered");
    }
    globalConfigSchematicsSet = true;
    selfRegistrationHost.setGlobalConfigSchematics(globalConfigSchematics);
    return pluginContext;
  },
  withToolsProvider: (toolsProvider2) => {
    if (toolsProviderSet) {
      throw new Error("Tools provider already registered");
    }
    if (predictionLoopHandlerSet) {
      throw new Error("Tools provider cannot be used with a predictionLoopHandler");
    }
    toolsProviderSet = true;
    selfRegistrationHost.setToolsProvider(toolsProvider2);
    return pluginContext;
  },
  withGenerator: (generator) => {
    if (generatorSet) {
      throw new Error("Generator already registered");
    }
    generatorSet = true;
    selfRegistrationHost.setGenerator(generator);
    return pluginContext;
  }
};
Promise.resolve().then(() => (init_src(), src_exports)).then(async (module2) => {
  return await module2.main(pluginContext);
}).then(() => {
  selfRegistrationHost.initCompleted();
}).catch((error) => {
  console.error("Failed to execute the main function of the plugin.");
  console.error(error);
});
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL3Rvb2xzUHJvdmlkZXIudHMiLCAiLi4vc3JjL2luZGV4LnRzIiwgImVudHJ5LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyB0b29sLCBUb29sc1Byb3ZpZGVyQ29udHJvbGxlciB9IGZyb20gXCJAbG1zdHVkaW8vc2RrXCI7XG5pbXBvcnQgeyB6IH0gZnJvbSBcInpvZFwiO1xuXG4vLyBTdG9yZSBsYXN0IHJlc3VsdCBmb3IgXCJhbnNcIiBzdXBwb3J0XG5sZXQgbGFzdFJlc3VsdDogbnVtYmVyID0gMDtcblxuLy8gRGVncmVlLWJhc2VkIHRyaWcgZnVuY3Rpb25zXG5jb25zdCBkZWdUb1JhZCA9IChkZWc6IG51bWJlcikgPT4gKGRlZyAqIE1hdGguUEkpIC8gMTgwO1xuY29uc3QgcmFkVG9EZWcgPSAocmFkOiBudW1iZXIpID0+IChyYWQgKiAxODApIC8gTWF0aC5QSTtcblxuY29uc3Qgc2luRGVnID0gKGRlZzogbnVtYmVyKSA9PiBNYXRoLnNpbihkZWdUb1JhZChkZWcpKTtcbmNvbnN0IGNvc0RlZyA9IChkZWc6IG51bWJlcikgPT4gTWF0aC5jb3MoZGVnVG9SYWQoZGVnKSk7XG5jb25zdCB0YW5EZWcgPSAoZGVnOiBudW1iZXIpID0+IE1hdGgudGFuKGRlZ1RvUmFkKGRlZykpO1xuXG4vLyBJbnZlcnNlIHRyaWcgXHUyMDE0IHJldHVybiBkZWdyZWVzXG5jb25zdCBhc2luRGVnID0gKHg6IG51bWJlcikgPT4gcmFkVG9EZWcoTWF0aC5hc2luKHgpKTtcbmNvbnN0IGFjb3NEZWcgPSAoeDogbnVtYmVyKSA9PiByYWRUb0RlZyhNYXRoLmFjb3MoeCkpO1xuY29uc3QgYXRhbkRlZyA9ICh4OiBudW1iZXIpID0+IHJhZFRvRGVnKE1hdGguYXRhbih4KSk7XG5cbi8vIEZhY3RvcmlhbFxuZnVuY3Rpb24gZmFjdG9yaWFsKG46IG51bWJlcik6IG51bWJlciB7XG4gIGlmICghTnVtYmVyLmlzSW50ZWdlcihuKSB8fCBuIDwgMCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgRmFjdG9yaWFsIGlzIG9ubHkgZGVmaW5lZCBmb3Igbm9uLW5lZ2F0aXZlIGludGVnZXJzLCBnb3Q6ICR7bn1gKTtcbiAgfVxuICBpZiAobiA+IDE3MCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgRmFjdG9yaWFsIG9mICR7bn0gaXMgdG9vIGxhcmdlIHRvIGNvbXB1dGVgKTtcbiAgfVxuICBsZXQgcmVzdWx0ID0gMTtcbiAgZm9yIChsZXQgaSA9IDI7IGkgPD0gbjsgaSsrKSB7XG4gICAgcmVzdWx0ICo9IGk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLy8gQ3VzdG9tIGxvZyBiYXNlIE46IGxvZ04oYmFzZSwgeClcbmZ1bmN0aW9uIGxvZ0Jhc2UoYmFzZTogbnVtYmVyLCB4OiBudW1iZXIpOiBudW1iZXIge1xuICByZXR1cm4gTWF0aC5sb2coeCkgLyBNYXRoLmxvZyhiYXNlKTtcbn1cblxuLy8gQWxsIGF2YWlsYWJsZSBmdW5jdGlvbnMgbWFwcGVkIGJ5IG5hbWVcbmNvbnN0IG1hdGhGdW5jdGlvbnM6IFJlY29yZDxzdHJpbmcsICguLi5hcmdzOiBudW1iZXJbXSkgPT4gbnVtYmVyPiA9IHtcbiAgLy8gQmFzaWNcbiAgYWJzOiBNYXRoLmFicyxcbiAgY2VpbDogTWF0aC5jZWlsLFxuICBmbG9vcjogTWF0aC5mbG9vcixcbiAgcm91bmQ6IE1hdGgucm91bmQsXG4gIHRydW5jOiBNYXRoLnRydW5jLFxuICBzaWduOiBNYXRoLnNpZ24sXG5cbiAgLy8gUG93ZXJzICYgcm9vdHNcbiAgc3FydDogTWF0aC5zcXJ0LFxuICBjYnJ0OiBNYXRoLmNicnQsXG4gIHBvdzogTWF0aC5wb3csXG4gIGV4cDogTWF0aC5leHAsXG5cbiAgLy8gTG9nYXJpdGhtc1xuICBsb2c6IE1hdGgubG9nMTAsICAgICAgIC8vIGxvZyh4KSAgPSBsb2cgYmFzZSAxMFxuICBsbjogTWF0aC5sb2csICAgICAgICAgIC8vIGxuKHgpICAgPSBuYXR1cmFsIGxvZ1xuICBsb2cyOiBNYXRoLmxvZzIsICAgICAgIC8vIGxvZzIoeCkgPSBsb2cgYmFzZSAyXG4gIGxvZ246IGxvZ0Jhc2UsICAgICAgICAgLy8gbG9nbihiYXNlLCB4KVxuXG4gIC8vIFRyaWdvbm9tZXRyeSAoZGVncmVlcylcbiAgc2luOiBzaW5EZWcsXG4gIGNvczogY29zRGVnLFxuICB0YW46IHRhbkRlZyxcbiAgYXNpbjogYXNpbkRlZyxcbiAgYWNvczogYWNvc0RlZyxcbiAgYXRhbjogYXRhbkRlZyxcblxuICAvLyBIeXBlcmJvbGljXG4gIHNpbmg6IE1hdGguc2luaCxcbiAgY29zaDogTWF0aC5jb3NoLFxuICB0YW5oOiBNYXRoLnRhbmgsXG4gIGFzaW5oOiBNYXRoLmFzaW5oLFxuICBhY29zaDogTWF0aC5hY29zaCxcbiAgYXRhbmg6IE1hdGguYXRhbmgsXG5cbiAgLy8gT3RoZXJcbiAgZmFjdG9yaWFsOiBmYWN0b3JpYWwsXG4gIG1pbjogTWF0aC5taW4sXG4gIG1heDogTWF0aC5tYXgsXG59O1xuXG5mdW5jdGlvbiBjYWxjdWxhdGUoZXhwcmVzc2lvbjogc3RyaW5nKTogbnVtYmVyIHtcbiAgbGV0IGV4cHIgPSBleHByZXNzaW9uXG4gICAgLnRyaW0oKVxuICAgIC5yZXBsYWNlKC9cXHMrL2csIFwiXCIpXG4gICAgLnJlcGxhY2UoLywvZywgXCIuXCIpO1xuXG4gIC8vIFJlcGxhY2UgY29uc3RhbnRzXG4gIC8vIFVzZSB3b3JkIGJvdW5kYXJpZXMgdG8gYXZvaWQgcmVwbGFjaW5nIFwiZVwiIGluc2lkZSBmdW5jdGlvbiBuYW1lcyBsaWtlIFwiY2VpbFwiXG4gIGV4cHIgPSBleHByLnJlcGxhY2UoL1xcYnBpXFxiL2dpLCBgKCR7TWF0aC5QSX0pYCk7XG4gIGV4cHIgPSBleHByLnJlcGxhY2UoL1xcYmVcXGIvZ2ksIGAoJHtNYXRoLkV9KWApO1xuICBleHByID0gZXhwci5yZXBsYWNlKC9cXGJhbnNcXGIvZ2ksIGAoJHtsYXN0UmVzdWx0fSlgKTtcbiAgZXhwciA9IGV4cHIucmVwbGFjZSgvXFxiaW5mXFxiL2dpLCBcIkluZmluaXR5XCIpO1xuXG4gIC8vIFJlcGxhY2UgXiB3aXRoICoqXG4gIGV4cHIgPSBleHByLnJlcGxhY2UoL1xcXi9nLCBcIioqXCIpO1xuXG4gIC8vIFJlcGxhY2UgISBmb3IgZmFjdG9yaWFsOiBlLmcuIFwiNSFcIiBcdTIxOTIgXCJmbl9mYWN0b3JpYWwoNSlcIlxuICAvLyBIYW5kbGVzIG51bWJlciEgYW5kICkhXG4gIGV4cHIgPSBleHByLnJlcGxhY2UoLyhcXGQrKSEvZywgXCJmbl9mYWN0b3JpYWwoJDEpXCIpO1xuICBleHByID0gZXhwci5yZXBsYWNlKC9cXCkhL2csIFwiKV9fRkFDVF9fXCIpO1xuXG4gIC8vIFJlcGxhY2UgZnVuY3Rpb24gbmFtZXMgd2l0aCBwcmVmaXhlZCB2ZXJzaW9ucyB0byBhdm9pZCBjb25mbGljdHNcbiAgY29uc3QgZm5OYW1lcyA9IE9iamVjdC5rZXlzKG1hdGhGdW5jdGlvbnMpO1xuICAvLyBTb3J0IGJ5IGxlbmd0aCBkZXNjZW5kaW5nIHNvIFwiZmFjdG9yaWFsXCIgaXMgbWF0Y2hlZCBiZWZvcmUgXCJmbG9vclwiIGV0Yy5cbiAgZm5OYW1lcy5zb3J0KChhLCBiKSA9PiBiLmxlbmd0aCAtIGEubGVuZ3RoKTtcblxuICBmb3IgKGNvbnN0IG5hbWUgb2YgZm5OYW1lcykge1xuICAgIGNvbnN0IHJlZ2V4ID0gbmV3IFJlZ0V4cChgXFxcXGIke25hbWV9XFxcXChgLCBcImdcIik7XG4gICAgZXhwciA9IGV4cHIucmVwbGFjZShyZWdleCwgYGZuXyR7bmFtZX0oYCk7XG4gIH1cblxuICAvLyBIYW5kbGUgKSEgZm9yIGZhY3RvcmlhbCBvZiBncm91cGVkIGV4cHJlc3Npb25zXG4gIGV4cHIgPSBleHByLnJlcGxhY2UoL19fRkFDVF9fL2csIFwiXCIpO1xuICAvLyBXZSBuZWVkIGEgZGlmZmVyZW50IGFwcHJvYWNoIGZvciApISBcdTIwMTQgbGV0J3Mgc2tpcCBmb3Igbm93LCBmYWN0b3JpYWwoZXhwcikgaXMgZW5vdWdoXG5cbiAgLy8gVmFsaWRhdGU6IG9ubHkgYWxsb3cgc2FmZSBjaGFyYWN0ZXJzXG4gIGNvbnN0IHNhZmVQYXR0ZXJuID0gL15bMC05K1xcLSovKCkuJSxmbl9hLXpBLVpcXHNdKyQvO1xuICBpZiAoIXNhZmVQYXR0ZXJuLnRlc3QoZXhwcikpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cHJlc3Npb24gY29udGFpbnMgaW52YWxpZCBjaGFyYWN0ZXJzOiBcIiR7ZXhwcmVzc2lvbn1cImApO1xuICB9XG5cbiAgLy8gQnVpbGQgZnVuY3Rpb24gYXJndW1lbnRzIGZvciB0aGUgRnVuY3Rpb24gY29uc3RydWN0b3JcbiAgY29uc3QgZm5QYXJhbU5hbWVzOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCBmblBhcmFtVmFsdWVzOiAoKC4uLmFyZ3M6IG51bWJlcltdKSA9PiBudW1iZXIpW10gPSBbXTtcblxuICBmb3IgKGNvbnN0IG5hbWUgb2YgZm5OYW1lcykge1xuICAgIGZuUGFyYW1OYW1lcy5wdXNoKGBmbl8ke25hbWV9YCk7XG4gICAgZm5QYXJhbVZhbHVlcy5wdXNoKG1hdGhGdW5jdGlvbnNbbmFtZV0pO1xuICB9XG5cbiAgY29uc3QgZm4gPSBuZXcgRnVuY3Rpb24oXG4gICAgLi4uZm5QYXJhbU5hbWVzLFxuICAgIGBcInVzZSBzdHJpY3RcIjsgcmV0dXJuICgke2V4cHJ9KTtgXG4gICk7XG5cbiAgY29uc3QgcmVzdWx0ID0gZm4oLi4uZm5QYXJhbVZhbHVlcyk7XG5cbiAgaWYgKHR5cGVvZiByZXN1bHQgIT09IFwibnVtYmVyXCIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cHJlc3Npb24gZGlkIG5vdCByZXR1cm4gYSBudW1iZXI6IFwiJHtleHByZXNzaW9ufVwiYCk7XG4gIH1cblxuICBpZiAoaXNOYU4ocmVzdWx0KSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgUmVzdWx0IGlzIE5hTiAobm90IGEgbnVtYmVyKSBmb3I6IFwiJHtleHByZXNzaW9ufVwiYCk7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdG9vbHNQcm92aWRlcihfY3RsOiBUb29sc1Byb3ZpZGVyQ29udHJvbGxlcikge1xuICBjb25zdCBjYWxjdWxhdG9yVG9vbCA9IHRvb2woe1xuICAgIG5hbWU6IFwiY2FsY3VsYXRlXCIsXG4gICAgZGVzY3JpcHRpb246IGBcbiAgICAgIEV2YWx1YXRlcyBhIG1hdGhlbWF0aWNhbCBleHByZXNzaW9uIGFuZCByZXR1cm5zIHRoZSBudW1lcmljIHJlc3VsdC5cbiAgICAgIEFsd2F5cyB1c2UgdGhpcyB0b29sIGZvciBBTlkgbWF0aCBcdTIwMTQgbmV2ZXIgY29tcHV0ZSBpbiB5b3VyIGhlYWQuXG5cbiAgICAgIEJBU0lDIEFSSVRITUVUSUM6XG4gICAgICAgICssIC0sICosIC8gICAgICAgICAgICAgIGUuZy4gXCIzICsgNSAqIDJcIiBcdTIxOTIgMTNcbiAgICAgICAgJSAgICAgICAgICAgICAgICAgICAgICAgbW9kdWxvLCBlLmcuIFwiMTAgJSAzXCIgXHUyMTkyIDFcbiAgICAgICAgXiAgICAgICAgICAgICAgICAgICAgICAgcG93ZXIsIGUuZy4gXCIyXjEwXCIgXHUyMTkyIDEwMjRcbiAgICAgICAgKCApICAgICAgICAgICAgICAgICAgICAgZ3JvdXBpbmcsIGUuZy4gXCIoMyArIDUpICogMlwiIFx1MjE5MiAxNlxuXG4gICAgICBGVU5DVElPTlM6XG4gICAgICAgIHNxcnQoeCkgICAgICAgICAgICAgICAgIHNxdWFyZSByb290LCBlLmcuIFwic3FydCgxNDQpXCIgXHUyMTkyIDEyXG4gICAgICAgIGNicnQoeCkgICAgICAgICAgICAgICAgIGN1YmUgcm9vdCwgZS5nLiBcImNicnQoMjcpXCIgXHUyMTkyIDNcbiAgICAgICAgcG93KHgsIHkpICAgICAgICAgICAgICAgeCB0byB0aGUgcG93ZXIgb2YgeSwgZS5nLiBcInBvdygyLCAxMClcIiBcdTIxOTIgMTAyNFxuICAgICAgICBleHAoeCkgICAgICAgICAgICAgICAgICBlXngsIGUuZy4gXCJleHAoMSlcIiBcdTIxOTIgMi43MTguLi5cbiAgICAgICAgYWJzKHgpICAgICAgICAgICAgICAgICAgYWJzb2x1dGUgdmFsdWUsIGUuZy4gXCJhYnMoLTUpXCIgXHUyMTkyIDVcbiAgICAgICAgY2VpbCh4KSAgICAgICAgICAgICAgICAgcm91bmQgdXAsIGUuZy4gXCJjZWlsKDQuMilcIiBcdTIxOTIgNVxuICAgICAgICBmbG9vcih4KSAgICAgICAgICAgICAgICByb3VuZCBkb3duLCBlLmcuIFwiZmxvb3IoNC44KVwiIFx1MjE5MiA0XG4gICAgICAgIHJvdW5kKHgpICAgICAgICAgICAgICAgIHJvdW5kIHRvIG5lYXJlc3QsIGUuZy4gXCJyb3VuZCg0LjUpXCIgXHUyMTkyIDVcbiAgICAgICAgdHJ1bmMoeCkgICAgICAgICAgICAgICAgdHJ1bmNhdGUgZGVjaW1hbCwgZS5nLiBcInRydW5jKDQuOSlcIiBcdTIxOTIgNFxuICAgICAgICBzaWduKHgpICAgICAgICAgICAgICAgICBzaWduIG9mIG51bWJlcjogLTEsIDAsIG9yIDFcbiAgICAgICAgbWluKGEsIGIsIC4uLikgICAgICAgICAgbWluaW11bSB2YWx1ZSwgZS5nLiBcIm1pbigzLCAxLCA1KVwiIFx1MjE5MiAxXG4gICAgICAgIG1heChhLCBiLCAuLi4pICAgICAgICAgIG1heGltdW0gdmFsdWUsIGUuZy4gXCJtYXgoMywgMSwgNSlcIiBcdTIxOTIgNVxuXG4gICAgICBMT0dBUklUSE1TOlxuICAgICAgICBsb2coeCkgICAgICAgICAgICAgICAgICBsb2cgYmFzZSAxMCwgZS5nLiBcImxvZygxMDAwKVwiIFx1MjE5MiAzXG4gICAgICAgIGxuKHgpICAgICAgICAgICAgICAgICAgIG5hdHVyYWwgbG9nLCBlLmcuIFwibG4oZSlcIiBcdTIxOTIgMVxuICAgICAgICBsb2cyKHgpICAgICAgICAgICAgICAgICBsb2cgYmFzZSAyLCBlLmcuIFwibG9nMigyNTYpXCIgXHUyMTkyIDhcbiAgICAgICAgbG9nbihiYXNlLCB4KSAgICAgICAgICAgbG9nIHdpdGggY3VzdG9tIGJhc2UsIGUuZy4gXCJsb2duKDMsIDgxKVwiIFx1MjE5MiA0XG5cbiAgICAgIFRSSUdPTk9NRVRSWSAoYWxsIGluIGRlZ3JlZXMpOlxuICAgICAgICBzaW4oeCksIGNvcyh4KSwgdGFuKHgpICAgICAgICAgICBlLmcuIFwic2luKDkwKVwiIFx1MjE5MiAxXG4gICAgICAgIGFzaW4oeCksIGFjb3MoeCksIGF0YW4oeCkgICAgICAgIGludmVyc2UsIHJldHVybnMgZGVncmVlcywgZS5nLiBcImFzaW4oMSlcIiBcdTIxOTIgOTBcblxuICAgICAgSFlQRVJCT0xJQzpcbiAgICAgICAgc2luaCh4KSwgY29zaCh4KSwgdGFuaCh4KVxuICAgICAgICBhc2luaCh4KSwgYWNvc2goeCksIGF0YW5oKHgpXG5cbiAgICAgIEZBQ1RPUklBTDpcbiAgICAgICAgZmFjdG9yaWFsKG4pICAgICAgICAgICAgZS5nLiBcImZhY3RvcmlhbCg1KVwiIFx1MjE5MiAxMjBcbiAgICAgICAgNSEgICAgICAgICAgICAgICAgICAgICAgc2hvcnRoYW5kLCBlLmcuIFwiNSFcIiBcdTIxOTIgMTIwXG5cbiAgICAgIENPTlNUQU5UUzpcbiAgICAgICAgcGkgICAgICAgICAgICAgICAgICAgICAgMy4xNDE1OS4uLlxuICAgICAgICBlICAgICAgICAgICAgICAgICAgICAgICAyLjcxODI4Li4uXG4gICAgICAgIGluZiAgICAgICAgICAgICAgICAgICAgIEluZmluaXR5XG5cbiAgICAgIFNQRUNJQUw6XG4gICAgICAgIGFucyAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCBvZiB0aGUgcHJldmlvdXMgY2FsY3VsYXRpb25cblxuICAgICAgQ09NUExFWCBFWEFNUExFUzpcbiAgICAgICAgXCJzcXJ0KHNpbig0NSleMiArIGNvcyg0NSleMilcIiAgICBcdTIxOTIgMVxuICAgICAgICBcImxvZygxMF41KVwiICAgICAgICAgICAgICAgICAgICAgICBcdTIxOTIgNVxuICAgICAgICBcImZhY3RvcmlhbCgxMCkgLyBmYWN0b3JpYWwoNylcIiAgICBcdTIxOTIgNzIwXG4gICAgICAgIFwiYWJzKHNpbigxODApIC0gY29zKDApKVwiICAgICAgICAgIFx1MjE5MiAxXG4gICAgYCxcbiAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICBleHByZXNzaW9uOiB6LnN0cmluZygpLmRlc2NyaWJlKFxuICAgICAgICBcIlRoZSBtYXRoZW1hdGljYWwgZXhwcmVzc2lvbiB0byBldmFsdWF0ZSwgZS5nLiAnc3FydCgyXjggKyBzaW4oMzApICogMTApJ1wiXG4gICAgICApLFxuICAgIH0sXG4gICAgaW1wbGVtZW50YXRpb246IGFzeW5jICh7IGV4cHJlc3Npb24gfSwgeyBzdGF0dXMgfSkgPT4ge1xuICAgICAgc3RhdHVzKGBDYWxjdWxhdGluZzogJHtleHByZXNzaW9ufWApO1xuXG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBjYWxjdWxhdGUoZXhwcmVzc2lvbik7XG5cbiAgICAgICAgLy8gU3RvcmUgZm9yIFwiYW5zXCJcbiAgICAgICAgbGFzdFJlc3VsdCA9IHJlc3VsdDtcblxuICAgICAgICAvLyBDbGVhbiB1cCBmbG9hdGluZyBwb2ludCBub2lzZVxuICAgICAgICBjb25zdCByb3VuZGVkID0gcGFyc2VGbG9hdChyZXN1bHQudG9QcmVjaXNpb24oMTIpKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGV4cHJlc3Npb24sXG4gICAgICAgICAgcmVzdWx0OiByb3VuZGVkLFxuICAgICAgICAgIGhpbnQ6IFwiWW91IGNhbiByZWZlcmVuY2UgdGhpcyByZXN1bHQgaW4gdGhlIG5leHQgY2FsY3VsYXRpb24gdXNpbmcgJ2FucycuXCIsXG4gICAgICAgIH07XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc3QgbWVzc2FnZSA9IGVyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLm1lc3NhZ2UgOiBTdHJpbmcoZXJyKTtcbiAgICAgICAgcmV0dXJuIGBFcnJvcjogJHttZXNzYWdlfS4gUGxlYXNlIGNoZWNrIHRoZSBleHByZXNzaW9uIGFuZCB0cnkgYWdhaW4uYDtcbiAgICAgIH1cbiAgICB9LFxuICB9KTtcblxuICByZXR1cm4gW2NhbGN1bGF0b3JUb29sXTtcbn1cbiIsICJpbXBvcnQgeyB0eXBlIFBsdWdpbkNvbnRleHQgfSBmcm9tIFwiQGxtc3R1ZGlvL3Nka1wiO1xyXG5pbXBvcnQgeyB0b29sc1Byb3ZpZGVyIH0gZnJvbSBcIi4vdG9vbHNQcm92aWRlclwiO1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG1haW4oY29udGV4dDogUGx1Z2luQ29udGV4dCkge1xyXG4gIGNvbnRleHQud2l0aFRvb2xzUHJvdmlkZXIodG9vbHNQcm92aWRlcik7XHJcbn1cclxuIiwgImltcG9ydCB7IExNU3R1ZGlvQ2xpZW50LCB0eXBlIFBsdWdpbkNvbnRleHQgfSBmcm9tIFwiQGxtc3R1ZGlvL3Nka1wiO1xuXG5kZWNsYXJlIHZhciBwcm9jZXNzOiBhbnk7XG5cbi8vIFdlIHJlY2VpdmUgcnVudGltZSBpbmZvcm1hdGlvbiBpbiB0aGUgZW52aXJvbm1lbnQgdmFyaWFibGVzLlxuY29uc3QgY2xpZW50SWRlbnRpZmllciA9IHByb2Nlc3MuZW52LkxNU19QTFVHSU5fQ0xJRU5UX0lERU5USUZJRVI7XG5jb25zdCBjbGllbnRQYXNza2V5ID0gcHJvY2Vzcy5lbnYuTE1TX1BMVUdJTl9DTElFTlRfUEFTU0tFWTtcbmNvbnN0IGJhc2VVcmwgPSBwcm9jZXNzLmVudi5MTVNfUExVR0lOX0JBU0VfVVJMO1xuXG5jb25zdCBjbGllbnQgPSBuZXcgTE1TdHVkaW9DbGllbnQoe1xuICBjbGllbnRJZGVudGlmaWVyLFxuICBjbGllbnRQYXNza2V5LFxuICBiYXNlVXJsLFxufSk7XG5cbihnbG9iYWxUaGlzIGFzIGFueSkuX19MTVNfUExVR0lOX0NPTlRFWFQgPSB0cnVlO1xuXG5sZXQgcHJlZGljdGlvbkxvb3BIYW5kbGVyU2V0ID0gZmFsc2U7XG5sZXQgcHJvbXB0UHJlcHJvY2Vzc29yU2V0ID0gZmFsc2U7XG5sZXQgY29uZmlnU2NoZW1hdGljc1NldCA9IGZhbHNlO1xubGV0IGdsb2JhbENvbmZpZ1NjaGVtYXRpY3NTZXQgPSBmYWxzZTtcbmxldCB0b29sc1Byb3ZpZGVyU2V0ID0gZmFsc2U7XG5sZXQgZ2VuZXJhdG9yU2V0ID0gZmFsc2U7XG5cbmNvbnN0IHNlbGZSZWdpc3RyYXRpb25Ib3N0ID0gY2xpZW50LnBsdWdpbnMuZ2V0U2VsZlJlZ2lzdHJhdGlvbkhvc3QoKTtcblxuY29uc3QgcGx1Z2luQ29udGV4dDogUGx1Z2luQ29udGV4dCA9IHtcbiAgd2l0aFByZWRpY3Rpb25Mb29wSGFuZGxlcjogKGdlbmVyYXRlKSA9PiB7XG4gICAgaWYgKHByZWRpY3Rpb25Mb29wSGFuZGxlclNldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUHJlZGljdGlvbkxvb3BIYW5kbGVyIGFscmVhZHkgcmVnaXN0ZXJlZFwiKTtcbiAgICB9XG4gICAgaWYgKHRvb2xzUHJvdmlkZXJTZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlByZWRpY3Rpb25Mb29wSGFuZGxlciBjYW5ub3QgYmUgdXNlZCB3aXRoIGEgdG9vbHMgcHJvdmlkZXJcIik7XG4gICAgfVxuXG4gICAgcHJlZGljdGlvbkxvb3BIYW5kbGVyU2V0ID0gdHJ1ZTtcbiAgICBzZWxmUmVnaXN0cmF0aW9uSG9zdC5zZXRQcmVkaWN0aW9uTG9vcEhhbmRsZXIoZ2VuZXJhdGUpO1xuICAgIHJldHVybiBwbHVnaW5Db250ZXh0O1xuICB9LFxuICB3aXRoUHJvbXB0UHJlcHJvY2Vzc29yOiAocHJlcHJvY2VzcykgPT4ge1xuICAgIGlmIChwcm9tcHRQcmVwcm9jZXNzb3JTZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlByb21wdFByZXByb2Nlc3NvciBhbHJlYWR5IHJlZ2lzdGVyZWRcIik7XG4gICAgfVxuICAgIHByb21wdFByZXByb2Nlc3NvclNldCA9IHRydWU7XG4gICAgc2VsZlJlZ2lzdHJhdGlvbkhvc3Quc2V0UHJvbXB0UHJlcHJvY2Vzc29yKHByZXByb2Nlc3MpO1xuICAgIHJldHVybiBwbHVnaW5Db250ZXh0O1xuICB9LFxuICB3aXRoQ29uZmlnU2NoZW1hdGljczogKGNvbmZpZ1NjaGVtYXRpY3MpID0+IHtcbiAgICBpZiAoY29uZmlnU2NoZW1hdGljc1NldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ29uZmlnIHNjaGVtYXRpY3MgYWxyZWFkeSByZWdpc3RlcmVkXCIpO1xuICAgIH1cbiAgICBjb25maWdTY2hlbWF0aWNzU2V0ID0gdHJ1ZTtcbiAgICBzZWxmUmVnaXN0cmF0aW9uSG9zdC5zZXRDb25maWdTY2hlbWF0aWNzKGNvbmZpZ1NjaGVtYXRpY3MpO1xuICAgIHJldHVybiBwbHVnaW5Db250ZXh0O1xuICB9LFxuICB3aXRoR2xvYmFsQ29uZmlnU2NoZW1hdGljczogKGdsb2JhbENvbmZpZ1NjaGVtYXRpY3MpID0+IHtcbiAgICBpZiAoZ2xvYmFsQ29uZmlnU2NoZW1hdGljc1NldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiR2xvYmFsIGNvbmZpZyBzY2hlbWF0aWNzIGFscmVhZHkgcmVnaXN0ZXJlZFwiKTtcbiAgICB9XG4gICAgZ2xvYmFsQ29uZmlnU2NoZW1hdGljc1NldCA9IHRydWU7XG4gICAgc2VsZlJlZ2lzdHJhdGlvbkhvc3Quc2V0R2xvYmFsQ29uZmlnU2NoZW1hdGljcyhnbG9iYWxDb25maWdTY2hlbWF0aWNzKTtcbiAgICByZXR1cm4gcGx1Z2luQ29udGV4dDtcbiAgfSxcbiAgd2l0aFRvb2xzUHJvdmlkZXI6ICh0b29sc1Byb3ZpZGVyKSA9PiB7XG4gICAgaWYgKHRvb2xzUHJvdmlkZXJTZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlRvb2xzIHByb3ZpZGVyIGFscmVhZHkgcmVnaXN0ZXJlZFwiKTtcbiAgICB9XG4gICAgaWYgKHByZWRpY3Rpb25Mb29wSGFuZGxlclNldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVG9vbHMgcHJvdmlkZXIgY2Fubm90IGJlIHVzZWQgd2l0aCBhIHByZWRpY3Rpb25Mb29wSGFuZGxlclwiKTtcbiAgICB9XG5cbiAgICB0b29sc1Byb3ZpZGVyU2V0ID0gdHJ1ZTtcbiAgICBzZWxmUmVnaXN0cmF0aW9uSG9zdC5zZXRUb29sc1Byb3ZpZGVyKHRvb2xzUHJvdmlkZXIpO1xuICAgIHJldHVybiBwbHVnaW5Db250ZXh0O1xuICB9LFxuICB3aXRoR2VuZXJhdG9yOiAoZ2VuZXJhdG9yKSA9PiB7XG4gICAgaWYgKGdlbmVyYXRvclNldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiR2VuZXJhdG9yIGFscmVhZHkgcmVnaXN0ZXJlZFwiKTtcbiAgICB9XG5cbiAgICBnZW5lcmF0b3JTZXQgPSB0cnVlO1xuICAgIHNlbGZSZWdpc3RyYXRpb25Ib3N0LnNldEdlbmVyYXRvcihnZW5lcmF0b3IpO1xuICAgIHJldHVybiBwbHVnaW5Db250ZXh0O1xuICB9LFxufTtcblxuaW1wb3J0KFwiLi8uLi9zcmMvaW5kZXgudHNcIikudGhlbihhc3luYyBtb2R1bGUgPT4ge1xuICByZXR1cm4gYXdhaXQgbW9kdWxlLm1haW4ocGx1Z2luQ29udGV4dCk7XG59KS50aGVuKCgpID0+IHtcbiAgc2VsZlJlZ2lzdHJhdGlvbkhvc3QuaW5pdENvbXBsZXRlZCgpO1xufSkuY2F0Y2goKGVycm9yKSA9PiB7XG4gIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gZXhlY3V0ZSB0aGUgbWFpbiBmdW5jdGlvbiBvZiB0aGUgcGx1Z2luLlwiKTtcbiAgY29uc29sZS5lcnJvcihlcnJvcik7XG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7OztBQW9CQSxTQUFTLFVBQVUsR0FBbUI7QUFDcEMsTUFBSSxDQUFDLE9BQU8sVUFBVSxDQUFDLEtBQUssSUFBSSxHQUFHO0FBQ2pDLFVBQU0sSUFBSSxNQUFNLDZEQUE2RCxDQUFDLEVBQUU7QUFBQSxFQUNsRjtBQUNBLE1BQUksSUFBSSxLQUFLO0FBQ1gsVUFBTSxJQUFJLE1BQU0sZ0JBQWdCLENBQUMsMEJBQTBCO0FBQUEsRUFDN0Q7QUFDQSxNQUFJ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TyxRQUFRLHdCQUF3QjtBQUVwRSxJQUFNLGdCQUErQjtBQUFBLEVBQ25DLDJCQUEyQixDQUFDLGFBQWE7QUFDdkMsUUFBSSwwQkFBMEI7QUFDNUIsWUFBTSxJQUFJLE1BQU0sMENBQTBDO0FBQUEsSUFDNUQ7QUFDQSxRQUFJLGtCQUFrQjtBQUNwQixZQUFNLElBQUksTUFBTSw0REFBNEQ7QUFBQSxJQUM5RTtBQUVBLCtCQUEyQjtBQUMzQix5QkFBcUIseUJBQXlCLFFBQVE7QUFDdEQsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUNBLHdCQUF3QixDQUFDLGVBQWU7QUFDdEMsUUFBSSx1QkFBdUI7QUFDekIsWUFBTSxJQUFJLE1BQU0sdUNBQXVDO0FBQUEsSUFDekQ7QUFDQSw0QkFBd0I7QUFDeEIseUJBQXFCLHNCQUFzQixVQUFVO0FBQ3JELFdBQU87QUFBQSxFQUNUO0FBQUEsRUFDQSxzQkFBc0IsQ0FBQyxxQkFBcUI7QUFDMUMsUUFBSSxxQkFBcUI7QUFDdkIsWUFBTSxJQUFJLE1BQU0sc0NBQXNDO0FBQUEsSUFDeEQ7QUFDQSwwQkFBc0I7QUFDdEIseUJBQXFCLG9CQUFvQixnQkFBZ0I7QUFDekQsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUNBLDRCQUE0QixDQUFDLDJCQUEyQjtBQUN0RCxRQUFJLDJCQUEyQjtBQUM3QixZQUFNLElBQUksTUFBTSw2Q0FBNkM7QUFBQSxJQUMvRDtBQUNBLGdDQUE0QjtBQUM1Qix5QkFBcUIsMEJBQTBCLHNCQUFzQjtBQUNyRSxXQUFPO0FBQUEsRUFDVDtBQUFBLEVBQ0EsbUJBQW1CLENBQUNDLG1CQUFrQjtBQUNwQyxRQUFJLGtCQUFrQjtBQUNwQixZQUFNLElBQUksTUFBTSxtQ0FBbUM7QUFBQSxJQUNyRDtBQUNBLFFBQUksMEJBQTBCO0FBQzVCLFlBQU0sSUFBSSxNQUFNLDREQUE0RDtBQUFBLElBQzlFO0FBRUEsdUJBQW1CO0FBQ25CLHlCQUFxQixpQkFBaUJBLGNBQWE7QUFDbkQsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUNBLGVBQWUsQ0FBQyxjQUFjO0FBQzVCLFFBQUksY0FBYztBQUNoQixZQUFNLElBQUksTUFBTSw4QkFBOEI7QUFBQSxJQUNoRDtBQUVBLG1CQUFlO0FBQ2YseUJBQXFCLGFBQWEsU0FBUztBQUMzQyxXQUFPO0FBQUEsRUFDVDtBQUNGO0FBRUEsd0RBQTRCLEtBQUssT0FBTUMsWUFBVTtBQUMvQyxTQUFPLE1BQU1BLFFBQU8sS0FBSyxhQUFhO0FBQ3hDLENBQUMsRUFBRSxLQUFLLE1BQU07QUFDWix1QkFBcUIsY0FBYztBQUNyQyxDQUFDLEVBQUUsTUFBTSxDQUFDLFVBQVU7QUFDbEIsVUFBUSxNQUFNLG9EQUFvRDtBQUNsRSxVQUFRLE1BQU0sS0FBSztBQUNyQixDQUFDOyIsCiAgIm5hbWVzIjogWyJpbXBvcnRfc2RrIiwgInRvb2xzUHJvdmlkZXIiLCAibW9kdWxlIl0KfQo=
